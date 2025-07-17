import express, { Request, Response, Router } from "express";
import { pool } from "../db";

const router = Router();

// ✅ جلب الطلبات التي تم الموافقة عليها مع معلومات المستخدم والعناصر
router.get("/orders", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        o.id AS order_id,
        o.delivery_link,
        o.created_at,
        o.notes,
        o.status,
        o.delivery_price,
        o.estimated_delivery_time,
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
      WHERE o.status = 'قادمة في الطريق'
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
