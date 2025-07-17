import express, { Router, Request, Response } from "express";
import { pool } from "../db";
import { broadcastNewOrder, broadcastOrderStatus } from "../websocket";
import { incrementTotalOrders, incrementTotalSales } from "../lib/statesRestornt";

const router = Router();

// ✅ تحديث حالة الطلب
router.put("/orders/:id", async (req: Request, res: Response): Promise<any> => {
  const orderId = Number(req.params.id);
  const { newStatus , delivery_price, estimated_delivery_time } = req.body;
  console.log(req.body);

  if (!newStatus) {
    return res.status(400).json({ error: "❌ الحالة الجديدة مطلوبة" });
  }

  try {
    const existingOrder = await pool.query("SELECT id FROM orders WHERE id = $1", [orderId]);
    if (existingOrder.rowCount === 0) {
      return res.status(404).json({ error: "❌ الطلب غير موجود" });
    }

if( delivery_price|| estimated_delivery_time){
  await pool.query("UPDATE orders SET status = $1 , delivery_price = $3, estimated_delivery_time = $4 WHERE id = $2", [newStatus, orderId, delivery_price, estimated_delivery_time]);
}else{
  await pool.query("UPDATE orders SET status = $1  WHERE id = $2", [newStatus, orderId]);
}
  

    broadcastOrderStatus(orderId, newStatus);

    if (newStatus === "قادمة في الطريق") {
      incrementTotalOrders();
    }

    if (newStatus === "تم التوصيل") {
      const result = await pool.query(
        `
        SELECT SUM(oi.quantity * f.price) AS total_price
        FROM order_items oi
        JOIN foods f ON oi.food_id = f.id
        WHERE oi.order_id = $1
        `,
        [orderId]
      );

      const totalPrice = result.rows[0].total_price ?? 0; // 🔒 معالجة null
      incrementTotalSales(totalPrice);
    }

    broadcastNewOrder(orderId);

    res.status(200).json({ message: "✅ تم تحديث حالة الطلب" });
  } catch (err) {
    console.error("❌ خطأ في التحديث:", err);
    res.status(500).json({ error: "حدث خطأ أثناء تحديث الطلب" });
  }
});

// ✅ جلب جميع الطلبات "قيد المعالجة"
router.get("/orders", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        o.id AS order_id,
        o.delivery_link,
        o.created_at,
        o.notes,
        u.fname,
        u.lname,
        u.phone,
        json_agg(
          json_build_object(
            'food_id', f.id,
            'title', f.title,
            'quantity', oi.quantity,
            'unit_price', f.price,
            'price', f.price * oi.quantity
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
