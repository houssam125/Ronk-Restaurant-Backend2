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
const express_1 = require("express");
const db_1 = require("../db");
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const router = (0, express_1.Router)();
const SECRET_KEY = "1hytyuhgdd"; // ⚠️ يُفضل تخزينه في ملف .env
// 🔒 دالة تشفير الدور
function encryptRole(role) {
    const iv = crypto_1.default.randomBytes(16);
    const salt = Buffer.from("salt");
    const key = crypto_1.default.pbkdf2Sync("1hytyuhgdd", salt, 1, 32, "sha1");
    const cipher = crypto_1.default.createCipheriv("aes-256-cbc", key, iv);
    let encrypted = cipher.update(role, "utf8", "base64");
    encrypted += cipher.final("base64");
    return {
        encrypted,
        iv: iv.toString("base64"),
    };
}
// ✅ تسجيل الدخول
router.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        const result = yield db_1.pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (result.rows.length === 0) {
            res.status(401).json({ success: false, message: "Invalid email or password" });
            return;
        }
        const user = result.rows[0];
        const isMatch = yield bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            res.status(401).json({ success: false, message: "Invalid email or password" });
            return;
        }
        const { encrypted, iv } = encryptRole(user.role);
        const userToSend = {
            id: user.id,
            fname: user.fname,
            lname: user.lname,
            email: user.email,
            phone: user.phone,
            role: encrypted,
            iv,
        };
        res.json({ success: true, user: userToSend });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
// ✅ إنشاء حساب جديد
router.post("/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { fname, lname, email, password, phone, role } = req.body;
    try {
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        const result = yield db_1.pool.query(`INSERT INTO users (fname, lname, email, password, phone, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`, [fname, lname, email, hashedPassword, phone, role]);
        const { encrypted, iv } = encryptRole(result.rows[0].role);
        const userToSend = {
            id: result.rows[0].id,
            fname: result.rows[0].fname,
            lname: result.rows[0].lname,
            email: result.rows[0].email,
            phone: result.rows[0].phone,
            role: encrypted,
            iv,
        };
        res.status(201).json({ success: true, user: userToSend });
    }
    catch (error) {
        console.error("Register error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}));
exports.default = router;
