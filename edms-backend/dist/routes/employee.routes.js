"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const employee_controller_1 = require("../controllers/employee.controller");
const auth_1 = require("../middleware/auth");
const schemas_1 = require("../lib/schemas");
const router = (0, express_1.Router)();
// All employee routes require authentication
router.use(auth_1.authenticate);
router.get('/', (0, auth_1.validate)(schemas_1.employeeQuerySchema, 'query'), employee_controller_1.getEmployees);
router.post('/', (0, auth_1.validate)(schemas_1.createEmployeeSchema), employee_controller_1.createEmployeeHandler);
router.get('/:id', employee_controller_1.getEmployeeById);
router.put('/:id', (0, auth_1.validate)(schemas_1.updateEmployeeSchema), employee_controller_1.updateEmployeeHandler);
router.get('/:id/audit', employee_controller_1.getEmployeeAuditLog);
router.patch('/:id/archive', employee_controller_1.archiveEmployeeHandler);
// Super Admin only
router.patch('/:id/restore', auth_1.requireSuperAdmin, employee_controller_1.restoreEmployeeHandler);
router.delete('/:id', auth_1.requireSuperAdmin, employee_controller_1.deleteEmployeeHandler);
exports.default = router;
//# sourceMappingURL=employee.routes.js.map