import { Router, Request, Response } from "express";
import { pool } from "../db";
import { QueryResult } from "pg";
import { broadcastNewOrder } from "../websocket";
import { incrementTotalOrders } from "../lib/statesRestornt";

const router = Router();

interface OrderItemInput {
  food_id: number;
  quantity: number;
}

interface CreateOrderRequestBody {
  user_id?: number;
  delivery_link?: string;

  items?: OrderItemInput[];
}

router.post("/", async (req: Request, res: Response): Promise<any> => {
  const { user_id, delivery_link , items }: CreateOrderRequestBody = req.body;

  // ✅ تحقق من صحة البيانات
  if (
    typeof user_id !== "number" ||
    typeof delivery_link !== "string" ||
    delivery_link.trim() === "" ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return res.status(400).json({
      success: false,
      message: "❌ بيانات الطلب ناقصة أو غير صحيحة.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ✅ تحقق من وجود المستخدم
    const userResult = await client.query("SELECT id FROM users WHERE id = $1", [user_id]);
    if (userResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ success: false, message: "❌ المستخدم غير موجود." });
    }

    // ✅ تحقق من أن كل العناصر تحتوي على بيانات صحيحة
    for (const item of items) {
      if (
        typeof item.food_id !== "number" ||
        typeof item.quantity !== "number" ||
        item.quantity <= 0
      ) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: `❌ عنصر غير صالح: ${JSON.stringify(item)}`,
        });
      }
    }

    // ✅ تحقق من أن جميع الـ food_id موجودة في جدول الأطعمة دفعة واحدة
    const foodIds = items.map((item) => item.food_id);
    const foodRes = await client.query(
      `SELECT id FROM foods WHERE id = ANY($1::int[])`,
      [foodIds]
    );

    const existingFoodIds = foodRes.rows.map((row) => row.id);
    const missingFoodIds = foodIds.filter(id => !existingFoodIds.includes(id));

    if (missingFoodIds.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: `❌ العناصر التالية غير موجودة في قاعدة البيانات: ${missingFoodIds.join(", ")}`,
      });
    }

    // ✅ إدخال الطلب 
    const orderResult: QueryResult<{
      status: string; id: number 
}> = await client.query(
      `
      INSERT INTO orders (user_id, delivery_link)
      VALUES ($1, $2)
      RETURNING id
      `,
      [user_id, delivery_link]
    );

    const orderId = orderResult.rows[0].id;

    // ✅ إدخال عناصر الطلب
    const insertItemQuery = `
      INSERT INTO order_items (order_id, food_id, quantity)
      VALUES ($1, $2, $3)
    `;

    for (const item of items) {
      await client.query(insertItemQuery, [
        orderId,
        item.food_id,
        item.quantity
      ]);
    }

    await client.query("COMMIT");


    
    // await broadcastNewOrder(orderId); // ⬅️ إرسال تفاصيل الطلب

    // await incrementTotalOrders();

    return res.status(201).json({
      success: true,
      message: "✅ تم إنشاء الطلب بنجاح",
      order: orderId,
    });
    
   

    
          
          
          
        
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ خطأ أثناء إنشاء الطلب:", err instanceof Error ? err.message : err);
    return res.status(500).json({
      success: false,
      message: "❌ حدث خطأ أثناء إنشاء الطلب.",
    });
  } finally {
    client.release();
  }
});


router.get("/user/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    // جلب الطلبات الخاصة بالمستخدم
    const ordersResult = await pool.query(
      `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    const orders = ordersResult.rows;

    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const itemsResult = await pool.query(
          `
          SELECT 
            oi.food_id,
            f.title,
            oi.quantity,
            f.price
          FROM order_items oi
          JOIN foods f ON oi.food_id = f.id
          WHERE oi.order_id = $1
          `,
          [order.id]
        );

        return {
          ...order,
          items: itemsResult.rows,
        };
      })
    );

    res.json({ success: true, orders: ordersWithItems });
  } catch (err) {
    console.error("Error fetching user orders:", err);
    res.status(500).json({ success: false, message: "خطأ في الخادم الداخلي." });
  }
});


export default router;
