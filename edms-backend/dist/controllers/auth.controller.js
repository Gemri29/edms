"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.logout = logout;
exports.refresh = refresh;
exports.me = me;
const auth_service_1 = require("../services/auth.service");
const IS_PROD = process.env.NODE_ENV === 'production';
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'strict',
    path: '/',
};
// ─── POST /api/auth/login ─────────────────────────────────────────────────────
async function login(req, res) {
    try {
        const { email, password } = req.body;
        const result = await (0, auth_service_1.loginUser)(email, password);
        res.cookie('access_token', result.accessToken, {
            ...COOKIE_OPTIONS,
            maxAge: 15 * 60 * 1000, // 15 minutes
        });
        res.cookie('refresh_token', result.refreshToken, {
            ...COOKIE_OPTIONS,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        res.json({
            success: true,
            data: {
                user: result.user,
                mustChangePw: result.mustChangePw,
            },
        });
    }
    catch (err) {
        res.status(401).json({ success: false, error: err.message });
    }
}
// ─── POST /api/auth/logout ────────────────────────────────────────────────────
async function logout(req, res) {
    try {
        const token = req.cookies?.access_token;
        if (token)
            await (0, auth_service_1.logoutUser)(token);
        res.clearCookie('access_token', COOKIE_OPTIONS);
        res.clearCookie('refresh_token', COOKIE_OPTIONS);
        res.json({ success: true, message: 'Logged out successfully.' });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
// ─── POST /api/auth/refresh ───────────────────────────────────────────────────
async function refresh(req, res) {
    try {
        const refreshToken = req.cookies?.refresh_token;
        if (!refreshToken) {
            res.status(401).json({ success: false, error: 'No refresh token provided.' });
            return;
        }
        const { accessToken } = await (0, auth_service_1.refreshAccessToken)(refreshToken);
        res.cookie('access_token', accessToken, {
            ...COOKIE_OPTIONS,
            maxAge: 15 * 60 * 1000,
        });
        res.json({ success: true, message: 'Token refreshed.' });
    }
    catch (err) {
        res.status(401).json({ success: false, error: err.message });
    }
}
// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
async function me(req, res) {
    const user = req.user;
    res.json({ success: true, data: { user } });
}
//# sourceMappingURL=auth.controller.js.map