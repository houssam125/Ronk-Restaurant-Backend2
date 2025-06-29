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
// ✅ جلب جميع الأطعمة
router.get("/", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield db_1.pool.query("SELECT * FROM foods ORDER BY id DESC");
        res.json({ foods: result.rows });
    }
    catch (err) {
        console.error("❌ فشل في جلب الأطعمة:", err);
        res.status(500).json({ error: "خطأ في الخادم" });
    }
}));
// ✅ إضافة عنصر جديد
router.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, category, image, price } = req.body;
    if (!title || !category || !image || typeof price !== "number") {
        return res.status(400).json({ error: "بيانات غير كاملة" });
    }
    try {
        const result = yield db_1.pool.query(`INSERT INTO foods (title, category, image, price) 
       VALUES ($1, $2, $3, $4) RETURNING *`, [title, category, image, price]);
        res.status(201).json({ food: result.rows[0] });
        (0, statesRestornt_1.incrementTotalMenuItems)();
    }
    catch (err) {
        console.error("❌ فشل في إضافة الطعام:", err);
        res.status(500).json({ error: "خطأ في الخادم" });
    }
}));
// ✅ تعديل عنصر
router.put("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { title, category, image, price } = req.body;
    try {
        const result = yield db_1.pool.query(`UPDATE foods SET title = $1, category = $2, image = $3, price = $4
       WHERE id = $5 RETURNING *`, [title, category, image, price, id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "العنصر غير موجود" });
        }
        res.json({ food: result.rows[0] });
    }
    catch (err) {
        console.error("❌ فشل في تعديل الطعام:", err);
        res.status(500).json({ error: "خطأ في الخادم" });
    }
}));
// ✅ حذف عنصر
router.delete("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const result = yield db_1.pool.query(`DELETE FROM foods WHERE id = $1 RETURNING *`, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "العنصر غير موجود" });
        }
        res.json({ message: "✅ تم الحذف بنجاح", food: result.rows[0] });
        (0, statesRestornt_1.incrementTotalMenuItems)();
    }
    catch (err) {
        console.error("❌ فشل في حذف الطعام:", err);
        res.status(500).json({ error: "خطأ في الخادم" });
    }
}));
exports.default = router;
