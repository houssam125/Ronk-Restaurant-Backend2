import { Router, Request, Response } from "express";
import { pool } from "../db";


const router = Router();

// جلب جميع الأطعمة
router.get("/", async (req: Request, res: Response): Promise<void>  => {
  try {
    const result = await pool.query("SELECT * FROM foods");
    res.json(result.rows);
    console.log("foods fetched successfully");
  } catch (err) {
    console.error("Error fetching foods:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});




export default router;
