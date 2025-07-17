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
router.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user_id, delivery_link, items, notes } = req.body;
    // ✅ التحقق من صحة البيانات
    if (typeof user_id !== "number" ||
        typeof notes !== "string" ||
        typeof delivery_link !== "string" ||
        delivery_link.trim() === "" ||
        !Array.isArray(items) ||
        items.length === 0) {
        return res.status(400).json({
            success: false,
            message: "❌ بيانات الطلب ناقصة أو غير صحيحة.",
        });
    }
    const client = yield db_1.pool.connect();
    try {
        yield client.query("BEGIN");
        // ✅ التحقق من وجود المستخدم
        const userResult = yield client.query("SELECT id FROM users WHERE id = $1", [user_id]);
        if (userResult.rowCount === 0) {
            yield client.query("ROLLBACK");
            return res.status(400).json({ success: false, message: "❌ المستخدم غير موجود." });
        }
        // ✅ التحقق من صحة العناصر
        for (const item of items) {
            if (typeof item.food_id !== "number" ||
                typeof item.quantity !== "number" ||
                item.quantity <= 0) {
                yield client.query("ROLLBACK");
                return res.status(400).json({
                    success: false,
                    message: `❌ عنصر غير صالح: ${JSON.stringify(item)}`,
                });
            }
        }
        // ✅ التحقق من وجود جميع الأطعمة
        const foodIds = items.map((item) => item.food_id);
        const foodRes = yield client.query(`SELECT id FROM foods WHERE id = ANY($1::int[])`, [foodIds]);
        const existingFoodIds = foodRes.rows.map((row) => row.id);
        const missingFoodIds = foodIds.filter(id => !existingFoodIds.includes(id));
        if (missingFoodIds.length > 0) {
            yield client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message: `❌ العناصر التالية غير موجودة في قاعدة البيانات: ${missingFoodIds.join(", ")}`,
            });
        }
        // ✅ إدخال الطلب مع الحقول الجديدة (nots والمبدئيات)
        const orderResult = yield client.query(`
      INSERT INTO orders (user_id, delivery_link, notes, delivery_price, estimated_delivery_time)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
      `, [user_id, delivery_link, notes, 0, '00:00:00']);
        const orderId = orderResult.rows[0].id;
        // ✅ إدخال عناصر الطلب
        const insertItemQuery = `
      INSERT INTO order_items (order_id, food_id, quantity)
      VALUES ($1, $2, $3)
    `;
        for (const item of items) {
            yield client.query(insertItemQuery, [
                orderId,
                item.food_id,
                item.quantity
            ]);
        }
        yield client.query("COMMIT");
        yield (0, websocket_1.broadcastNewOrder)(orderId); // إرسال الطلب بالبث
        yield (0, statesRestornt_1.incrementTotalOrders)(); // زيادة العداد
        return res.status(201).json({
            success: true,
            message: "✅ تم إنشاء الطلب بنجاح",
            order: orderId,
        });
    }
    catch (err) {
        yield client.query("ROLLBACK");
        console.error("❌ خطأ أثناء إنشاء الطلب:", err instanceof Error ? err.message : err);
        return res.status(500).json({
            success: false,
            message: "❌ حدث خطأ أثناء إنشاء الطلب.",
        });
    }
    finally {
        client.release();
    }
}));
// ✅ عرض طلبات المستخدم
router.get("/user/:userId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.userId;
    try {
        const ordersResult = yield db_1.pool.query(`SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);
        const orders = ordersResult.rows;
        const ordersWithItems = yield Promise.all(orders.map((order) => __awaiter(void 0, void 0, void 0, function* () {
            const itemsResult = yield db_1.pool.query(`
          SELECT 
            oi.food_id,
            f.title,
            oi.quantity,
            f.price
          FROM order_items oi
          JOIN foods f ON oi.food_id = f.id
          WHERE oi.order_id = $1
          `, [order.id]);
            return Object.assign(Object.assign({}, order), { items: itemsResult.rows });
        })));
        res.json({ success: true, orders: ordersWithItems });
    }
    catch (err) {
        console.error("Error fetching user orders:", err);
        res.status(500).json({ success: false, message: "خطأ في الخادم الداخلي." });
    }
}));
exports.default = router;
