import express from "express";
import cors from "cors";
import compression from "compression";
import http from "http";
import { setupWebSocket } from "./websocket";

// Routes
import foodRoutes from "./routes/food.routes";
import authRoutes from "./routes/auth.routes";
import ordersRoutes from "./routes/orders.routes";
import adminRoutes from "./routes/admin.routes";
import complaintsRoutes from "./routes/complaints.routes";
import deliveryRoutes from "./routes/delivery.routes";

import "./cronJobs/deleteOldOrders";
import statesRoutes from "./routes/states.routes";
import adminFoodsRoutes from "./routes/admin.foods.routes";
import userManagementRoutes from "./routes/user.mangment.routes";

const app = express();
const server = http.createServer(app); // مهم: هذا ما نمرره إلى WebSocket

app.use(compression());
app.use(cors({ origin: "http://localhost:5174" }));
app.use(express.json());

// استخدام الراوترات
app.use("/foods", foodRoutes);
app.use("/auth", authRoutes);
app.use("/orders", ordersRoutes);
app.use("/admin", adminRoutes);
app.use("/complaints", complaintsRoutes);
app.use("/delivery", deliveryRoutes);
app.use("/states", statesRoutes);
app.use("/admin/foods", adminFoodsRoutes);
app.use("/user/management", userManagementRoutes);

// WebSocket
setupWebSocket(server);

const PORT = 3002;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
