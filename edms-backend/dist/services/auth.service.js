"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.signRefreshToken = signRefreshToken;
exports.loginUser = loginUser;
exports.logoutUser = logoutUser;
exports.refreshAccessToken = refreshAccessToken;
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.purgeExpiredTokens = purgeExpiredTokens;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const ACCESS_TOKEN_EXPIRES = process.env.JWT_EXPIRES_IN ?? '15m';
const REFRESH_TOKEN_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES_IN ?? '7d';
// ─── Token Helpers ────────────────────────────────────────────────────────────
function signAccessToken(payload) {
    return jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRES,
    });
}
function signRefreshToken(userId) {
    return jsonwebtoken_1.default.sign({ sub: userId }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: REFRESH_TOKEN_EXPIRES,
    });
}
function msFromExpiry(exp) {
    const unit = exp.slice(-1);
    const value = parseInt(exp.slice(0, -1));
    const map = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return value * (map[unit] ?? 60000);
}
// ─── Login ────────────────────────────────────────────────────────────────────
async function loginUser(email, password) {
    const user = await prisma_1.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    // Generic error — don't reveal whether email exists
    const invalidCredentials = new Error('Invalid email or password');
    if (!user)
        throw invalidCredentials;
    if (!user.isActive)
        throw new Error('Your account has been deactivated. Contact a Super Admin.');
    const passwordValid = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!passwordValid)
        throw invalidCredentials;
    // Update last login timestamp
    await prisma_1.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
    });
    const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken(user.id);
    return {
        accessToken,
        refreshToken,
        mustChangePw: user.mustChangePw,
        user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
        },
    };
}
// ─── Logout ───────────────────────────────────────────────────────────────────
async function logoutUser(token) {
    // Decode without verifying to get expiry (it may already be expired)
    const decoded = jsonwebtoken_1.default.decode(token);
    const expiresAt = decoded?.exp
        ? new Date(decoded.exp * 1000)
        : new Date(Date.now() + msFromExpiry(ACCESS_TOKEN_EXPIRES));
    await prisma_1.prisma.tokenBlocklist.create({
        data: { token, userId: decoded?.sub ?? 'unknown', expiresAt },
    });
}
// ─── Refresh Token ────────────────────────────────────────────────────────────
async function refreshAccessToken(refreshToken) {
    let payload;
    try {
        payload = jsonwebtoken_1.default.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    }
    catch {
        throw new Error('Invalid or expired refresh token');
    }
    const user = await prisma_1.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive)
        throw new Error('User not found or deactivated');
    const newAccessToken = signAccessToken({
        sub: user.id,
        email: user.email,
        role: user.role,
    });
    return { accessToken: newAccessToken };
}
// ─── Hash password ────────────────────────────────────────────────────────────
async function hashPassword(password) {
    return bcryptjs_1.default.hash(password, 12);
}
async function verifyPassword(plain, hash) {
    return bcryptjs_1.default.compare(plain, hash);
}
// ─── Clean up expired blocklist entries (run in cron) ────────────────────────
async function purgeExpiredTokens() {
    await prisma_1.prisma.tokenBlocklist.deleteMany({
        where: { expiresAt: { lt: new Date() } },
    });
}
//# sourceMappingURL=auth.service.js.map