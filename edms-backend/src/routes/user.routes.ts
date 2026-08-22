import { Router } from 'express'
import {
  getUsersHandler,
  getUserHandler,
  createUserHandler,
  updateUserHandler,
  deactivateUserHandler,
} from '../controllers/user.controller'
import { authenticate, requireSuperAdmin, validate } from '../middleware/auth'
import { createUserSchema, updateUserSchema } from '../lib/schemas'

const router = Router()

// All user management routes require Super Admin
router.use(authenticate, requireSuperAdmin)

router.get('/',                       getUsersHandler)
router.post('/',   validate(createUserSchema),  createUserHandler)
router.get('/:id',                    getUserHandler)
router.put('/:id', validate(updateUserSchema),  updateUserHandler)
router.patch('/:id/deactivate',       deactivateUserHandler)

export default router
