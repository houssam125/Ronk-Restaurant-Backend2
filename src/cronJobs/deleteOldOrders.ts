import cron from "node-cron";
import {pool}  from "../db"; // الاتصال بقاعدة البيانات PostgreSQL

// حذف الطلبات التي مر عليها أكثر من 24 ساعة كل ساعة
cron.schedule("0 * * * *", async () => {
  try {
    const result = await pool.query(`
      DELETE FROM orders WHERE created_at < NOW() - INTERVAL '24 hours';
    `);
    console.log(`🧹 حذف ${result.rowCount} طلبًا مر عليه أكثر من 24 ساعة.`);
  } catch (err) {
    console.error("❌ فشل في حذف الطلبات القديمة:", err);
  }
});
