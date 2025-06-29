// src/db.ts
import { Pool } from "pg";

export const pool = new Pool({
  user: "postgres",          // اسم المستخدم لقاعدة البيانات
  host: "localhost",         // غالباً localhost
  database: "RawnecFood",    // اسم قاعدة البيانات (عدله حسب ما أنشأته)
  password: "admin",     // ضع كلمة السر الخاصة بك
  port: 5432                 // منفذ PostgreSQL (الافتراضي 5432)
});
