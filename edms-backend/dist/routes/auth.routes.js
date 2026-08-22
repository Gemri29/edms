"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_1 = require("../middleware/auth");
const auth_2 = require("../middleware/auth");
const schemas_1 = require("../lib/schemas");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = (0, express_1.Router)();
// Strict rate limit on login — 5 attempts per 15 minutes per IP
const loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        error: 'Too many login attempts. Please try again in 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
router.post('/login', loginLimiter, (0, auth_2.validate)(schemas_1.loginSchema), auth_controller_1.login);
router.post('/logout', auth_1.authenticate, auth_controller_1.logout);
router.post('/refresh', auth_controller_1.refresh);
router.get('/me', auth_1.authenticate, auth_controller_1.me);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map