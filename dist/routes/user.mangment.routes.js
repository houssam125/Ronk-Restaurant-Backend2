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
// 🔵 جلب جميع المستخدمين
router.get("/users", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield db_1.pool.query("SELECT id, fname, lname, email, role FROM users");
        res.json({ users: result.rows });
    }
    catch (err) {
        res.status(500).json({ message: "فشل في جلب المستخدمين" });
    }
}));
// 🟡 تحديث الدور
router.put("/users/:id/role", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = parseInt(req.params.id);
    const { role } = req.body;
    if (!["admin", "user", "delivery"].includes(role)) {
        return res.status(400).json({ message: "دور غير صالح" });
    }
    try {
        yield db_1.pool.query("UPDATE users SET role = $1 WHERE id = $2", [role, userId]);
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ message: "فشل في تحديث الدور" });
    }
}));
// 🔴 حذف مستخدم
router.delete("/users/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = parseInt(req.params.id);
    try {
        yield db_1.pool.query("DELETE FROM users WHERE id = $1", [userId]);
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ message: "فشل في حذف الحساب" });
    }
}));
exports.default = router;
