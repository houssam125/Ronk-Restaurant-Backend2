import express from "express";
import { pool } from "../db";
import { incrementTotalMenuItems } from "../lib/statesRestornt";

const router = express.Router();

// ✅ جلب جميع الأطعمة
router.get("/", async (_req, res) => {
  try {
    const result = await pool.query("SELECT * FROM foods ORDER BY id DESC");
    res.json({ foods: result.rows });
  } catch (err) {
    console.error("❌ فشل في جلب الأطعمة:", err);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ✅ إضافة عنصر جديد
router.post("/", async (req, res): Promise<any>=> {
  const { title, category, image, price } = req.body;

  if (!title || !category || !image || typeof price !== "number") {
    return res.status(400).json({ error: "بيانات غير كاملة" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO foods (title, category, image, price) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [title, category, image, price]
    );
    res.status(201).json({ food: result.rows[0] });
    incrementTotalMenuItems();

  } catch (err) {
    console.error("❌ فشل في إضافة الطعام:", err);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ✅ تعديل عنصر
router.put("/:id", async (req, res): Promise<any> => {
  const { id } = req.params;
  const { title, category, image, price } = req.body;

  try {
    const result = await pool.query(
      `UPDATE foods SET title = $1, category = $2, image = $3, price = $4
       WHERE id = $5 RETURNING *`,
      [title, category, image, price, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "العنصر غير موجود" });
    }

    res.json({ food: result.rows[0] });
  } catch (err) {
    console.error("❌ فشل في تعديل الطعام:", err);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ✅ حذف عنصر
router.delete("/:id", async (req, res): Promise<any> => {
  const { id } = req.params;

  try {
    const result = await pool.query(`DELETE FROM foods WHERE id = $1 RETURNING *`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "العنصر غير موجود" });
    }

    res.json({ message: "✅ تم الحذف بنجاح", food: result.rows[0] });
    incrementTotalMenuItems();
  } catch (err) {
    console.error("❌ فشل في حذف الطعام:", err);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
