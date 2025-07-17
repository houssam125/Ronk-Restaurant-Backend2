import { Server as WebSocketServer, WebSocket } from "ws";
import { pool } from "./db";

let wss: WebSocketServer;

// ✅ تعريف نوع الطلب
type OrderItem = {
  food_id: number;
  title: string;
  price: number;
  quantity: number;
};

type OrderResponse = {
  order_id: number;
  delivery_link: string;
  created_at: string;
  fname: string;
  lname: string;
  phone: string;
  status: string;
  items: OrderItem[];
  total_price: number;
};

// ✅ تهيئة WebSocket وربطه مع السيرفر
let connectionCount = 0;

export const setupWebSocket = (server: any) => {
  wss = new WebSocketServer({ server });

  wss.on("connection", (ws: WebSocket) => {
    connectionCount++;
    console.log("✅ WebSocket client connected. Total connections:", connectionCount);
  });
};


// ✅ دالة إرسال الحالة الجديدة للطلب (تحديث حالة)
export const broadcastOrderStatus = async (orderId: number, newStatus: string) => {
  let delivery_price: number | null = null;
  let estimated_delivery_time: string | null = null;

  if (newStatus === "قادمة في الطريق" || newStatus === "تم التوصيل") {
    const result = await pool.query(
      `SELECT delivery_price, estimated_delivery_time FROM orders WHERE id = $1`,
      [orderId]
    );

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
};

export const changeRestaurantStatus = (VALUES: number, attribute: string) => {
  const message = JSON.stringify({
    type: "restaurant_status_update",
    VALUES,
    attribute,
  });

  sendToAllClients(message);
};

// ✅ دالة إرسال طلب جديد للمستخدمين
export const broadcastNewOrder = async (orderId: number) => {
  try {
    const result = await pool.query(`
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

    const order: OrderResponse = result.rows[0];

   
    if (order.status === "قادمة في الطريق" || order.status === "قيد المعالجة"  ) {
      let type = "new_order";

      if(order.status === "قادمة في الطريق"){
         type = "new_order_delivery";
      }
      

  
      

    const message = JSON.stringify({
      type,
      order,
    });

    sendToAllClients(message);
    }else{
      console.error("نوع الطلب لايسمح ارساله");
      return;
    }
    


  } catch (error) {
    console.error("❌ فشل في إرسال الطلب الجديد عبر WebSocket:", error);
  }
};

// ✅ إرسال رسالة لكل الكلاينتات المفتوحة
const sendToAllClients = (message: string) => {
  if (!wss) return;

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};
