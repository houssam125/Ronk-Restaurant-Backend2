import express, { Router, Request, Response } from "express";
import { pool } from "../db";
import { broadcastNewOrder, broadcastOrderStatus } from "../websocket";
import { incrementTotalOrders } from "../lib/statesRestornt";

const router = Router();

// تحديث حالة الطلب حسب ID
router.put("/orders/:id", async (req: Request, res: Response): Promise<any> => {
  const orderId = Number(req.params.id);
  const { newStatus } = req.body;

  if (!newStatus) {
    return res.status(400).json({ error: "❌ الحالة الجديدة مطلوبة" });
  }

  try {
    // تحقق من وجود الطلب
    const existingOrder = await pool.query(
      "SELECT id FROM orders WHERE id = $1",
      [orderId]
    );

    if (existingOrder.rowCount === 0) {
      return res.status(404).json({ error: "❌ الطلب غير موجود" });
    }

    // تحديث الحالة
    await pool.query(
      "UPDATE orders SET status = $1 WHERE id = $2",
      [newStatus, orderId]
    );

    // إرسال التحديث عبر WebSocket للجميع
    broadcastOrderStatus(orderId, newStatus);
   incrementTotalOrders()
    // ✅ إذا كانت الحالة الجديدة "تم الموافقة"، جلب تفاصيل الطلب وإرساله عبر WebSocket
  

    broadcastNewOrder(orderId); // ⬅️ إرسال تفاصيل الطلب
      
    

    res.status(200).json({ message: "✅ تم تحديث حالة الطلب" });
  } catch (err) {
    console.error("❌ خطأ في التحديث:", err);
    res.status(500).json({ error: "حدث خطأ أثناء تحديث الطلب" });
  }
});


router.get("/orders", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        o.id AS order_id,
        o.delivery_link,
        o.created_at,
        u.fname,
        u.lname,
        u.phone,
        json_agg(
          json_build_object(
            'food_id', f.id,
            'title', f.title,             -- ← اسم المأكول
            'quantity', oi.quantity,
            'unit_price', f.price,        -- ← السعر الفردي
            'price', f.price * oi.quantity -- ← السعر الإجمالي لكل عنصر
          )
        ) AS items,
        SUM(f.price * oi.quantity) AS total_price
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN order_items oi ON o.id = oi.order_id
      JOIN foods f ON oi.food_id = f.id
      WHERE o.status = 'قيد المعالجة'
      GROUP BY o.id, u.id
      ORDER BY o.created_at DESC
    `);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ خطأ أثناء جلب الطلبات:", err);
    res.status(500).json({ error: "حدث خطأ أثناء جلب الطلبات" });
  }
});

export default router;
