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
const node_cron_1 = __importDefault(require("node-cron"));
const db_1 = require("../db"); // الاتصال بقاعدة البيانات PostgreSQL
// حذف الطلبات التي مر عليها أكثر من 24 ساعة كل ساعة
node_cron_1.default.schedule("0 * * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield db_1.pool.query(`
      DELETE FROM orders WHERE created_at < NOW() - INTERVAL '24 hours';
    `);
        console.log(`🧹 حذف ${result.rowCount} طلبًا مر عليه أكثر من 24 ساعة.`);
    }
    catch (err) {
        console.error("❌ فشل في حذف الطلبات القديمة:", err);
    }
}));
