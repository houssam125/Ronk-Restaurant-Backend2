import { pool } from "../db";
import { changeRestaurantStatus } from "../websocket";

export async function incrementTotalOrders() {
  try {
    // 🔄 احسب عدد الطلبات التي حالتها "قيد المعالجة"
    const result = await pool.query(
      `SELECT COUNT(*) AS count FROM orders WHERE status = 'قيد المعالجة'`
    );

    const processingOrdersCount = parseInt(result.rows[0].count, 10);


    console.log(`✅ تم تحديث عدد الطلبات قيد المعالجة إلى ${processingOrdersCount}`);

    // 📢 أرسل القيمة الجديدة إلى WebSocket
    changeRestaurantStatus(processingOrdersCount, "total_orders");

  } catch (err) {
    console.error("❌ فشل في تحديث عدد الطلبات:", err);
  }
}


export async function incrementTotalSales(value: number) {
  try {
    await pool.query(
      `UPDATE restaurant_stats 
       SET total_sales = total_sales + $1, last_updated = CURRENT_TIMESTAMP 
       WHERE id = 1`,
      [value]
    );
    console.log("✅ تم إضافة إلى المبيعات");
    const result = await pool.query(`
      SELECT total_sales
      FROM restaurant_stats
      WHERE id = 1
    `);
    changeRestaurantStatus(result.rows[0].total_sales, "total_sales");
  } catch (err) {
    console.error("❌ فشل في تحديث المبيعات:", err);
  }
}

export async function incrementTotalMenuItems() {
  try {
    // 🔄 جلب عدد عناصر القائمة من جدول foods
    const result = await pool.query(
      `SELECT COUNT(*) AS count FROM foods`
    );

    const menuItemCount = parseInt(result.rows[0].count, 10);


    console.log(`✅ تم تحديث عدد عناصر القائمة إلى ${menuItemCount}`);

    // 📢 إرسال التحديث عبر WebSocket
    changeRestaurantStatus(menuItemCount, "total_menu_items");

  } catch (err) {
    console.error("❌ فشل في تحديث عناصر القائمة:", err);
  }
}






export async function incrementTotalComplaints() {
  try {
    // 🔄 حساب عدد الشكاوى في جدول complaints
    const result = await pool.query(`
      SELECT COUNT(*) AS count FROM complaints
    `);

    const complaintCount = parseInt(result.rows[0].count, 10);


    console.log(`✅ تم تحديث عدد الشكاوي إلى ${complaintCount}`);

    // 📢 إرسال التحديث عبر WebSocket
    changeRestaurantStatus(complaintCount, "total_complaints");

  } catch (err) {
    console.error("❌ فشل في تحديث الشكاوي:", err);
  }
}