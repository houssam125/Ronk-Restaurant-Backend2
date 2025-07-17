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
exports.broadcastNewOrder = exports.changeRestaurantStatus = exports.broadcastOrderStatus = exports.setupWebSocket = void 0;
const ws_1 = require("ws");
const db_1 = require("./db");
let wss;
// ✅ تهيئة WebSocket وربطه مع السيرفر
let connectionCount = 0;
const setupWebSocket = (server) => {
    wss = new ws_1.Server({ server });
    wss.on("connection", (ws) => {
        connectionCount++;
        console.log("✅ WebSocket client connected. Total connections:", connectionCount);
    });
};
exports.setupWebSocket = setupWebSocket;
// ✅ دالة إرسال الحالة الجديدة للطلب (تحديث حالة)
const broadcastOrderStatus = (orderId, newStatus) => __awaiter(void 0, void 0, void 0, function* () {
    let delivery_price = null;
    let estimated_delivery_time = null;
    if (newStatus === "قادمة في الطريق" || newStatus === "تم التوصيل") {
        const result = yield db_1.pool.query(`SELECT delivery_price, estimated_delivery_time FROM orders WHERE id = $1`, [orderId]);
        if (result.rows.length > 0) {
            delivery_price = result.rows[0].delivery_price;
            estimated_delivery_time = result.rows[0].estimated_delivery_time;
        }
    }
    const message = JSON.stringify({
        type: "order_status_update",
        orderId,
        newStatus,
        delivery_price,
        estimated_delivery_time,
    });
    sendToAllClients(message);
});
exports.broadcastOrderStatus = broadcastOrderStatus;
const changeRestaurantStatus = (VALUES, attribute) => {
    const message = JSON.stringify({
        type: "restaurant_status_update",
        VALUES,
        attribute,
    });
    sendToAllClients(message);
};
exports.changeRestaurantStatus = changeRestaurantStatus;
// ✅ دالة إرسال طلب جديد للمستخدمين
const broadcastNewOrder = (orderId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield db_1.pool.query(`
      SELECT 
        o.id AS order_id,
        o.delivery_link,
        o.status,
        o.delivery_price,
        o.estimated_delivery_time,
        o.notes,
        o.created_at,
        u.fname,
        u.lname,
        u.phone,
        json_agg(
          json_build_object(
            'food_id', f.id,
            'title', f.title,
            'price', f.price * oi.quantity,
            'quantity', oi.quantity
          )
        ) AS items,
        SUM(f.price * oi.quantity) AS total_price
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN order_items oi ON o.id = oi.order_id
      JOIN foods f ON oi.food_id = f.id
      WHERE o.id = $1
      GROUP BY o.id, u.id
    `, [orderId]);
        if (result.rows.length === 0) {
            console.error("❌ لم يتم العثور على تفاصيل الطلب");
            return;
        }
        const order = result.rows[0];
        if (order.status === "قادمة في الطريق" || order.status === "قيد المعالجة") {
            let type = "new_order";
            if (order.status === "قادمة في الطريق") {
                type = "new_order_delivery";
            }
            const message = JSON.stringify({
                type,
                order,
            });
            sendToAllClients(message);
        }
        else {
            console.error("نوع الطلب لايسمح ارساله");
            return;
        }
    }
    catch (error) {
        console.error("❌ فشل في إرسال الطلب الجديد عبر WebSocket:", error);
    }
});
exports.broadcastNewOrder = broadcastNewOrder;
// ✅ إرسال رسالة لكل الكلاينتات المفتوحة
const sendToAllClients = (message) => {
    if (!wss)
        return;
    wss.clients.forEach((client) => {
        if (client.readyState === ws_1.WebSocket.OPEN) {
            client.send(message);
        }
    });
};
