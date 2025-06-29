import express from "express";
import { pool } from "../db";

const router = express.Router();

// ✅ API يعرض القيم الرئيسية فقط
router.get("/", async (req, res): Promise<any> => {
  try {
    // 🔹 تشغيل جميع الاستعلامات دفعة واحدة
    const [ordersResult, menuResult, complaintsResult, salesResult] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS count FROM orders WHERE status = 'قيد المعالجة'`),
      pool.query(`SELECT COUNT(*) AS count FROM foods`),
      pool.query(`SELECT COUNT(*) AS count FROM complaints`),
      pool.query(`SELECT total_sales FROM restaurant_stats WHERE id = 1`)
    ]);

    // 🔹 استخراج القيم
    const total_orders = parseInt(ordersResult.rows[0].count, 10);
    const total_menu_items = parseInt(menuResult.rows[0].count, 10);
    const total_complaints = parseInt(complaintsResult.rows[0].count, 10);
    const total_sales = salesResult.rows[0]?.total_sales ?? 0;

    return res.json({
      total_orders,
      total_sales,
      total_menu_items,
      total_complaints,
    });

  } catch (err) {
    console.error("❌ فشل في جلب الحالة:", err);
    return res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
