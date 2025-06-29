import { Router, Request, Response } from "express";
import { pool } from "../db";
import bcrypt from "bcrypt";
import crypto from "crypto";

const router = Router();
const SECRET_KEY = "1hytyuhgdd"; // ⚠️ يُفضل تخزينه في ملف .env

interface User {
  id: number;
  fname: string;
  lname: string;
  email: string;
  password: string;
  phone: string;
  role: string;
  created_at: string;
}

// 🔒 دالة تشفير الدور
function encryptRole(role: string): { encrypted: string; iv: string } {
  const iv = crypto.randomBytes(16);
  const salt = Buffer.from("salt");
  const key = crypto.pbkdf2Sync("1hytyuhgdd", salt, 1, 32, "sha1");

  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(role, "utf8", "base64");
  encrypted += cipher.final("base64");

  return {
    encrypted,
    iv: iv.toString("base64"),
  };
}


// ✅ تسجيل الدخول
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    const result = await pool.query<User>("SELECT * FROM users WHERE email = $1", [email]);

    if (result.rows.length === 0) {
      res.status(401).json({ success: false, message: "Invalid email or password" });
      return;
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      res.status(401).json({ success: false, message: "Invalid email or password" });
      return;
    }

    const { encrypted, iv } = encryptRole(user.role);

    const userToSend = {
      id: user.id,
      fname: user.fname,
      lname: user.lname,
      email: user.email,
      phone: user.phone,
      role: encrypted,
      iv,
    };

    res.json({ success: true, user: userToSend });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ✅ إنشاء حساب جديد
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  const { fname, lname, email, password, phone, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query<User>(
      `INSERT INTO users (fname, lname, email, password, phone, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [fname, lname, email, hashedPassword, phone, role]
    );

    const { encrypted, iv } = encryptRole(result.rows[0].role);

    const userToSend = {
      id: result.rows[0].id,
      fname: result.rows[0].fname,
      lname: result.rows[0].lname,
      email: result.rows[0].email,
      phone: result.rows[0].phone,
      role: encrypted,
      iv,
    };

    res.status(201).json({ success: true, user: userToSend });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;
