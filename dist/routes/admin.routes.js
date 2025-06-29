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
const express_1 = require("express");
const db_1 = require("../db");
const websocket_1 = require("../websocket");
const statesRestornt_1 = require("../lib/statesRestornt");
const router = (0, express_1.Router)();
// تحديث حالة الطلب حسب ID
router.put("/orders/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const orderId = Number(req.params.id);
    const { newStatus } = req.body;
    if (!newStatus) {
        return res.status(400).json({ error: "❌ الحالة الجديدة مطلوبة" });
    }
    try {
        // تحقق من وجود الطلب
        const existingOrder = yield db_1.pool.query("SELECT id FROM orders WHERE id = $1", [orderId]);
        if (existingOrder.rowCount === 0) {
            return res.status(404).json({ error: "❌ الطلب غير موجود" });
        }
        // تحديث الحالة
        yield db_1.pool.query("UPDATE orders SET status = $1 WHERE id = $2", [newStatus, orderId]);
        // إرسال التحديث عبر WebSocket للجميع
        (0, websocket_1.broadcastOrderStatus)(orderId, newStatus);
        (0, statesRestornt_1.incrementTotalOrders)();
        // ✅ إذا كانت الحالة الجديدة "تم الموافقة"، جلب تفاصيل الطلب وإرساله عبر WebSocket
        (0, websocket_1.broadcastNewOrder)(orderId); // ⬅️ إرسال تفاصيل الطلب
        res.status(200).json({ message: "✅ تم تحديث حالة الطلب" });
    }
    catch (err) {
        console.error("❌ خطأ في التحديث:", err);
        res.status(500).json({ error: "حدث خطأ أثناء تحديث الطلب" });
    }
}));
router.get("/orders", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield db_1.pool.query(`
      SELECT 
        o.id AS order_id,
        o.delivery_link,
        o.created_at,
        u.fname,
        u.lname,
        u.phone,
        json_agg(
          json_build_object(
            'food_id', f.id,
            'title', f.title,             -- ← اسم المأكول
            'quantity', oi.quantity,
            'unit_price', f.price,        -- ← السعر الفردي
            'price', f.price * oi.quantity -- ← السعر الإجمالي لكل عنصر
          )
        ) AS items,
        SUM(f.price * oi.quantity) AS total_price
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN order_items oi ON o.id = oi.order_id
      JOIN foods f ON oi.food_id = f.id
      WHERE o.status = 'قيد المعالجة'
      GROUP BY o.id, u.id
      ORDER BY o.created_at DESC
    `);
        res.status(200).json(result.rows);
    }
    catch (err) {
        console.error("❌ خطأ أثناء جلب الطلبات:", err);
        res.status(500).json({ error: "حدث خطأ أثناء جلب الطلبات" });
    }
}));
exports.default = router;
