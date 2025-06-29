"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const http_1 = __importDefault(require("http"));
const websocket_1 = require("./websocket");
// Routes
const food_routes_1 = __importDefault(require("./routes/food.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const orders_routes_1 = __importDefault(require("./routes/orders.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const complaints_routes_1 = __importDefault(require("./routes/complaints.routes"));
const delivery_routes_1 = __importDefault(require("./routes/delivery.routes"));
require("./cronJobs/deleteOldOrders");
const states_routes_1 = __importDefault(require("./routes/states.routes"));
const admin_foods_routes_1 = __importDefault(require("./routes/admin.foods.routes"));
const user_mangment_routes_1 = __importDefault(require("./routes/user.mangment.routes"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app); // مهم: هذا ما نمرره إلى WebSocket
app.use((0, compression_1.default)());
app.use((0, cors_1.default)({ origin: "http://localhost:5174" }));
app.use(express_1.default.json());
// استخدام الراوترات
app.use("/foods", food_routes_1.default);
app.use("/auth", auth_routes_1.default);
app.use("/orders", orders_routes_1.default);
app.use("/admin", admin_routes_1.default);
app.use("/complaints", complaints_routes_1.default);
app.use("/delivery", delivery_routes_1.default);
app.use("/states", states_routes_1.default);
app.use("/admin/foods", admin_foods_routes_1.default);
app.use("/user/management", user_mangment_routes_1.default);
// WebSocket
(0, websocket_1.setupWebSocket)(server);
const PORT = 3002;
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
