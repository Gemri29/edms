"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsersHandler = getUsersHandler;
exports.getUserHandler = getUserHandler;
exports.createUserHandler = createUserHandler;
exports.updateUserHandler = updateUserHandler;
exports.deactivateUserHandler = deactivateUserHandler;
const user_service_1 = require("../services/user.service");
// ─── GET /api/users ───────────────────────────────────────────────────────────
async function getUsersHandler(req, res) {
    try {
        const users = await (0, user_service_1.listUsers)();
        res.json({ success: true, data: users });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
// ─── GET /api/users/:id ───────────────────────────────────────────────────────
async function getUserHandler(req, res) {
    try {
        const user = await (0, user_service_1.getUser)(typeof req.params.id === 'string' ? req.params.id : '');
        res.json({ success: true, data: user });
    }
    catch (err) {
        const status = err.message === 'User not found' ? 404 : 500;
        res.status(status).json({ success: false, error: err.message });
    }
}
// ─── POST /api/users ──────────────────────────────────────────────────────────
async function createUserHandler(req, res) {
    try {
        const caller = req.user;
        const user = await (0, user_service_1.createUser)(req.body, caller.sub);
        res.status(201).json({ success: true, data: user });
    }
    catch (err) {
        const msg = err.message;
        const status = msg.includes('already exists') ? 409 : 500;
        res.status(status).json({ success: false, error: msg });
    }
}
// ─── PUT /api/users/:id ───────────────────────────────────────────────────────
async function updateUserHandler(req, res) {
    try {
        const caller = req.user;
        const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const user = await (0, user_service_1.updateUser)(userId, req.body, caller.sub);
        res.json({ success: true, data: user });
    }
    catch (err) {
        const msg = err.message;
        const status = msg === 'User not found' ? 404 : 400;
        res.status(status).json({ success: false, error: msg });
    }
}
// ─── PATCH /api/users/:id/deactivate ─────────────────────────────────────────
async function deactivateUserHandler(req, res) {
    try {
        const caller = req.user;
        const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const user = await (0, user_service_1.deactivateUser)(userId, caller.sub);
        res.json({ success: true, data: user });
    }
    catch (err) {
        const msg = err.message;
        const status = msg === 'User not found' ? 404 : 400;
        res.status(status).json({ success: false, error: msg });
    }
}
//# sourceMappingURL=user.controller.js.map