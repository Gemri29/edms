"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const node_cron_1 = __importDefault(require("node-cron"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const employee_routes_1 = __importDefault(require("./routes/employee.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const ocr_routes_1 = __importDefault(require("./routes/ocr.routes"));
const notification_service_1 = require("./services/notification.service");
const auth_service_1 = require("./services/auth.service");
const app = (0, express_1.default)();
// ─── Security headers ─────────────────────────────────────────────────────────
app.use((0, helmet_1.default)());
// ─── CORS — only allow the configured frontend origin ─────────────────────────
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true, // required for HTTP-only cookies
}));
// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express_1.default.json({ limit: '6mb' })); // 6mb for base64 image uploads
app.use((0, cookie_parser_1.default)());
// ─── Global rate limit (100 req/min per IP) ───────────────────────────────────
app.use((0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests. Please slow down.' },
}));
// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', auth_routes_1.default);
app.use('/api/employees', employee_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/ocr', ocr_routes_1.default);
// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Route not found.' });
});
// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error('[error]', err);
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred.'
            : err.message,
    });
});
// ─── Cron: daily expiry digest at 8:00 AM UAE time ───────────────────────────
node_cron_1.default.schedule(process.env.NOTIFICATION_CRON ?? '0 8 * * *', async () => {
    console.log('[cron] Running expiry notification digest...');
    try {
        await (0, notification_service_1.sendExpiryDigest)();
    }
    catch (err) {
        console.error('[cron] Digest failed:', err);
    }
}, { timezone: 'Asia/Dubai' });
// ─── Cron: purge expired JWT blocklist entries at midnight ────────────────────
node_cron_1.default.schedule('0 0 * * *', async () => {
    console.log('[cron] Purging expired tokens...');
    try {
        await (0, auth_service_1.purgeExpiredTokens)();
    }
    catch (err) {
        console.error('[cron] Purge failed:', err);
    }
});
// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => {
    console.log(`🚀 EDMS API running on http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV ?? 'development'}`);
    console.log(`   Frontend:    ${process.env.FRONTEND_URL ?? 'http://localhost:5173'}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map