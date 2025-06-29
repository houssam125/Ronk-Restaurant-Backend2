import express, { Request, Response } from "express";
import { pool } from "../db";
import { incrementTotalComplaints } from "../lib/statesRestornt";

const router = express.Router();


// ✅ 1. API لإضافة شكوى (نسخة مخففة)
router.post("/", async (req: Request, res: Response): Promise<any> => {
  const { user_id, message } = req.body;

  if (!user_id || !message) {
    return res.status(400).json({ error: "user_id و message مطلوبان" });
  }

  try {
    await pool.query(
      "INSERT INTO complaints (user_id, message) VALUES ($1, $2)",
      [user_id, message]
    );

    // ✅ فقط تأكيد النجاح بدون إرجاع البيانات
    res.status(201).json({ message: "✅ تم إرسال البلاغ بنجاح" });
    incrementTotalComplaints()
  } catch (err) {
    console.error("❌ خطأ أثناء إرسال البلاغ:", err);
    res.status(500).json({ error: "حدث خطأ أثناء إرسال البلاغ" });
  }
});



router.get("/", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.id,
        c.message,
        c.created_at,
        u.fname,
        u.lname,
        u.email,
        u.phone  -- ✅ رقم الهاتف
      FROM complaints c
      JOIN users u ON c.user_id = u.id
      ORDER BY c.created_at DESC
    `);

    res.status(200).json({ complaints: result.rows });
  } catch (err) {
    console.error("❌ خطأ أثناء جلب الشكاوى:", err);
    res.status(500).json({ error: "حدث خطأ أثناء جلب الشكاوى" });
  }
});

export default router;
