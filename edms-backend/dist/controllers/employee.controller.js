"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmployees = getEmployees;
exports.getEmployeeById = getEmployeeById;
exports.createEmployeeHandler = createEmployeeHandler;
exports.updateEmployeeHandler = updateEmployeeHandler;
exports.archiveEmployeeHandler = archiveEmployeeHandler;
exports.restoreEmployeeHandler = restoreEmployeeHandler;
exports.deleteEmployeeHandler = deleteEmployeeHandler;
exports.getEmployeeAuditLog = getEmployeeAuditLog;
const employee_service_1 = require("../services/employee.service");
// ─── GET /api/employees ───────────────────────────────────────────────────────
async function getEmployees(req, res) {
    try {
        const validatedQuery = req.validatedQuery ?? req.query;
        const result = await (0, employee_service_1.listEmployees)(validatedQuery);
        res.json({ success: true, ...result });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
// ─── GET /api/employees/:id ───────────────────────────────────────────────────
async function getEmployeeById(req, res) {
    try {
        const employee = await (0, employee_service_1.getEmployee)(req.params.id);
        res.json({ success: true, data: employee });
    }
    catch (err) {
        const status = err.message === 'Employee not found' ? 404 : 500;
        res.status(status).json({ success: false, error: err.message });
    }
}
// ─── POST /api/employees ──────────────────────────────────────────────────────
async function createEmployeeHandler(req, res) {
    try {
        const user = req.user;
        const employee = await (0, employee_service_1.createEmployee)(req.body, user.sub);
        res.status(201).json({ success: true, data: employee });
    }
    catch (err) {
        const msg = err.message;
        const status = msg.includes('already in use') ? 409 : 500;
        res.status(status).json({ success: false, error: msg });
    }
}
// ─── PUT /api/employees/:id ───────────────────────────────────────────────────
async function updateEmployeeHandler(req, res) {
    try {
        const user = req.user;
        const employee = await (0, employee_service_1.updateEmployee)(req.params.id, req.body, user.sub);
        res.json({ success: true, data: employee });
    }
    catch (err) {
        const msg = err.message;
        const status = msg === 'Employee not found' ? 404 : 400;
        res.status(status).json({ success: false, error: msg });
    }
}
// ─── PATCH /api/employees/:id/archive ────────────────────────────────────────
async function archiveEmployeeHandler(req, res) {
    try {
        const user = req.user;
        const employee = await (0, employee_service_1.archiveEmployee)(req.params.id, user.sub);
        res.json({ success: true, data: employee });
    }
    catch (err) {
        const msg = err.message;
        const status = msg === 'Employee not found' ? 404 : 400;
        res.status(status).json({ success: false, error: msg });
    }
}
// ─── PATCH /api/employees/:id/restore ────────────────────────────────────────
async function restoreEmployeeHandler(req, res) {
    try {
        const user = req.user;
        const employee = await (0, employee_service_1.restoreEmployee)(req.params.id, user.sub);
        res.json({ success: true, data: employee });
    }
    catch (err) {
        const msg = err.message;
        const status = msg === 'Employee not found' ? 404 : 400;
        res.status(status).json({ success: false, error: msg });
    }
}
// ─── DELETE /api/employees/:id ────────────────────────────────────────────────
async function deleteEmployeeHandler(req, res) {
    try {
        const user = req.user;
        await (0, employee_service_1.deleteEmployee)(req.params.id, user.sub);
        res.json({ success: true, message: 'Employee record permanently deleted.' });
    }
    catch (err) {
        const msg = err.message;
        const status = msg === 'Employee not found' ? 404 : 500;
        res.status(status).json({ success: false, error: msg });
    }
}
// ─── GET /api/employees/:id/audit ────────────────────────────────────────────
async function getEmployeeAuditLog(req, res) {
    try {
        const employee = await (0, employee_service_1.getEmployee)(req.params.id);
        res.json({ success: true, data: employee.auditLogs ?? [] });
    }
    catch (err) {
        const status = err.message === 'Employee not found' ? 404 : 500;
        res.status(status).json({ success: false, error: err.message });
    }
}
//# sourceMappingURL=employee.controller.js.map