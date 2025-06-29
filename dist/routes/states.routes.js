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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../db");
const router = express_1.default.Router();
// ✅ API يعرض القيم الرئيسية فقط
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // 🔹 تشغيل جميع الاستعلامات دفعة واحدة
        const [ordersResult, menuResult, complaintsResult, salesResult] = yield Promise.all([
            db_1.pool.query(`SELECT COUNT(*) AS count FROM orders WHERE status = 'قيد المعالجة'`),
            db_1.pool.query(`SELECT COUNT(*) AS count FROM foods`),
            db_1.pool.query(`SELECT COUNT(*) AS count FROM complaints`),
            db_1.pool.query(`SELECT total_sales FROM restaurant_stats WHERE id = 1`)
        ]);
        // 🔹 استخراج القيم
        const total_orders = parseInt(ordersResult.rows[0].count, 10);
        const total_menu_items = parseInt(menuResult.rows[0].count, 10);
        const total_complaints = parseInt(complaintsResult.rows[0].count, 10);
        const total_sales = (_b = (_a = salesResult.rows[0]) === null || _a === void 0 ? void 0 : _a.total_sales) !== null && _b !== void 0 ? _b : 0;
        return res.json({
            total_orders,
            total_sales,
            total_menu_items,
            total_complaints,
        });
    }
    catch (err) {
        console.error("❌ فشل في جلب الحالة:", err);
        return res.status(500).json({ error: "خطأ في الخادم" });
    }
}));
exports.default = router;
