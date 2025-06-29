import express from "express";
import { pool } from "../db";

const router = express.Router();

// 🔵 جلب جميع المستخدمين
router.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, fname, lname, email, role FROM users");
    res.json({ users: result.rows });
  } catch (err) {
    res.status(500).json({ message: "فشل في جلب المستخدمين" });
  }
});

// 🟡 تحديث الدور
router.put("/users/:id/role", async (req, res): Promise<any> => {
  const userId = parseInt(req.params.id);
  const { role } = req.body;

  if (!["admin", "user", "delivery"].includes(role)) {
    return res.status(400).json({ message: "دور غير صالح" });
  }

  try {
    await pool.query("UPDATE users SET role = $1 WHERE id = $2", [role, userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "فشل في تحديث الدور" });
  }
});

// 🔴 حذف مستخدم
router.delete("/users/:id", async (req, res) => {
  const userId = parseInt(req.params.id);
  try {
    await pool.query("DELETE FROM users WHERE id = $1", [userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "فشل في حذف الحساب" });
  }
});

export default router;
