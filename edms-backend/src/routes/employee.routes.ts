import { Router } from 'express'
import {
  getEmployees,
  getEmployeeById,
  createEmployeeHandler,
  updateEmployeeHandler,
  archiveEmployeeHandler,
  restoreEmployeeHandler,
  deleteEmployeeHandler,
  getEmployeeAuditLog,
} from '../controllers/employee.controller'
import { authenticate, requireSuperAdmin, validate } from '../middleware/auth'
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeQuerySchema,
} from '../lib/schemas'

const router = Router()

// All employee routes require authentication
router.use(authenticate)

router.get('/',    validate(employeeQuerySchema, 'query'), getEmployees)
router.post('/',   validate(createEmployeeSchema),         createEmployeeHandler)

router.get('/:id',              getEmployeeById)
router.put('/:id',              validate(updateEmployeeSchema), updateEmployeeHandler)
router.get('/:id/audit',        getEmployeeAuditLog)
router.patch('/:id/archive',    archiveEmployeeHandler)

// Super Admin only
router.patch('/:id/restore',    requireSuperAdmin, restoreEmployeeHandler)
router.delete('/:id',           requireSuperAdmin, deleteEmployeeHandler)

export default router
