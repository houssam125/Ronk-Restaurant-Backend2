"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.incrementTotalOrders = incrementTotalOrders;
exports.incrementTotalSales = incrementTotalSales;
exports.incrementTotalMenuItems = incrementTotalMenuItems;
exports.incrementTotalComplaints = incrementTotalComplaints;
const db_1 = require("../db");
const websocket_1 = require("../websocket");
function incrementTotalOrders() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // 🔄 احسب عدد الطلبات التي حالتها "قيد المعالجة"
            const result = yield db_1.pool.query(`SELECT COUNT(*) AS count FROM orders WHERE status = 'قيد المعالجة'`);
            const processingOrdersCount = parseInt(result.rows[0].count, 10);
            console.log(`✅ تم تحديث عدد الطلبات قيد المعالجة إلى ${processingOrdersCount}`);
            // 📢 أرسل القيمة الجديدة إلى WebSocket
            (0, websocket_1.changeRestaurantStatus)(processingOrdersCount, "total_orders");
        }
        catch (err) {
            console.error("❌ فشل في تحديث عدد الطلبات:", err);
        }
    });
}
function incrementTotalSales(value) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield db_1.pool.query(`UPDATE restaurant_stats 
   SET total_sales = total_sales + $1 
   WHERE id = 1
   RETURNING total_sales`, [value]);
            if (result.rows.length > 0) {
                console.log(`✅ تم تحديث إجمالي المبيعات إلى ${result.rows[0].total_sales}`);
                (0, websocket_1.changeRestaurantStatus)(result.rows[0].total_sales, "total_sales");
            }
            else {
                console.warn("⚠️ لم يتم العثور على السطر لإجمالي المبيعات");
            }
        }
        catch (err) {
            console.error("❌ فشل في تحديث المبيعات:", err);
        }
    });
}
function incrementTotalMenuItems() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // 🔄 جلب عدد عناصر القائمة من جدول foods
            const result = yield db_1.pool.query(`SELECT COUNT(*) AS count FROM foods`);
            const menuItemCount = parseInt(result.rows[0].count, 10);
            console.log(`✅ تم تحديث عدد عناصر القائمة إلى ${menuItemCount}`);
            // 📢 إرسال التحديث عبر WebSocket
            (0, websocket_1.changeRestaurantStatus)(menuItemCount, "total_menu_items");
        }
        catch (err) {
            console.error("❌ فشل في تحديث عناصر القائمة:", err);
        }
    });
}
function incrementTotalComplaints() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // 🔄 حساب عدد الشكاوى في جدول complaints
            const result = yield db_1.pool.query(`
      SELECT COUNT(*) AS count FROM complaints
    `);
            const complaintCount = parseInt(result.rows[0].count, 10);
            console.log(`✅ تم تحديث عدد الشكاوي إلى ${complaintCount}`);
            // 📢 إرسال التحديث عبر WebSocket
            (0, websocket_1.changeRestaurantStatus)(complaintCount, "total_complaints");
        }
        catch (err) {
            console.error("❌ فشل في تحديث الشكاوي:", err);
        }
    });
}
