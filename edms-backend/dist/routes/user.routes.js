"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_1 = require("../middleware/auth");
const schemas_1 = require("../lib/schemas");
const router = (0, express_1.Router)();
// All user management routes require Super Admin
router.use(auth_1.authenticate, auth_1.requireSuperAdmin);
router.get('/', user_controller_1.getUsersHandler);
router.post('/', (0, auth_1.validate)(schemas_1.createUserSchema), user_controller_1.createUserHandler);
router.get('/:id', user_controller_1.getUserHandler);
router.put('/:id', (0, auth_1.validate)(schemas_1.updateUserSchema), user_controller_1.updateUserHandler);
router.patch('/:id/deactivate', user_controller_1.deactivateUserHandler);
exports.default = router;
//# sourceMappingURL=user.routes.js.map