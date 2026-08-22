"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireSuperAdmin = requireSuperAdmin;
exports.validate = validate;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
// ─── Verify JWT from HTTP-only cookie ────────────────────────────────────────
async function authenticate(req, res, next) {
    try {
        const token = req.cookies?.access_token;
        if (!token) {
            res.status(401).json({ success: false, error: 'Authentication required' });
            return;
        }
        // Check token blocklist (handles explicit logout)
        const blocked = await prisma_1.prisma.tokenBlocklist.findUnique({
            where: { token },
        });
        if (blocked) {
            res.status(401).json({ success: false, error: 'Session expired. Please sign in again.' });
            return;
        }
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = payload;
        next();
    }
    catch (err) {
        if (err instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({ success: false, error: 'Session expired. Please sign in again.' });
        }
        else {
            res.status(401).json({ success: false, error: 'Invalid session.' });
        }
    }
}
// ─── Super Admin only guard ───────────────────────────────────────────────────
function requireSuperAdmin(req, res, next) {
    const user = req.user;
    if (!user || user.role !== client_1.Role.SUPER_ADMIN) {
        res.status(403).json({
            success: false,
            error: 'Access denied. Super Admin privileges required.',
        });
        return;
    }
    next();
}
function validate(schema, source = 'body') {
    return (req, res, next) => {
        const result = schema.safeParse(source === 'body' ? req.body : req.query);
        if (!result.success) {
            res.status(422).json({
                success: false,
                error: 'Validation failed',
                details: result.error.flatten().fieldErrors,
            });
            return;
        }
        if (source === 'body') {
            req.body = result.data;
        }
        else {
            ;
            req.validatedQuery = result.data;
        }
        next();
    };
}
//# sourceMappingURL=auth.js.map