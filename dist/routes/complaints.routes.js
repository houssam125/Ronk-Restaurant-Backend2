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
const statesRestornt_1 = require("../lib/statesRestornt");
const router = express_1.default.Router();
// ✅ 1. API لإضافة شكوى (نسخة مخففة)
router.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user_id, message } = req.body;
    if (!user_id || !message) {
        return res.status(400).json({ error: "user_id و message مطلوبان" });
    }
    try {
        yield db_1.pool.query("INSERT INTO complaints (user_id, message) VALUES ($1, $2)", [user_id, message]);
        // ✅ فقط تأكيد النجاح بدون إرجاع البيانات
        res.status(201).json({ message: "✅ تم إرسال البلاغ بنجاح" });
        (0, statesRestornt_1.incrementTotalComplaints)();
    }
    catch (err) {
        console.error("❌ خطأ أثناء إرسال البلاغ:", err);
        res.status(500).json({ error: "حدث خطأ أثناء إرسال البلاغ" });
    }
}));
router.get("/", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield db_1.pool.query(`
      SELECT 
        c.id,
        c.message,
        c.created_at,
        u.fname,
        u.lname,
        u.email,
        u.phone  -- ✅ رقم الهاتف
      FROM complaints c
      JOIN users u ON c.user_id = u.id
      ORDER BY c.created_at DESC
    `);
        res.status(200).json({ complaints: result.rows });
    }
    catch (err) {
        console.error("❌ خطأ أثناء جلب الشكاوى:", err);
        res.status(500).json({ error: "حدث خطأ أثناء جلب الشكاوى" });
    }
}));
exports.default = router;
