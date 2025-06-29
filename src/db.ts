import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config(); // تحميل متغيرات البيئة من .env عند التطوير المحلي فقط

export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
  ssl: {
    rejectUnauthorized: false
  }
});
