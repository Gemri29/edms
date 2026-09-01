import { Router } from 'express'
import { login, logout, refresh, me } from '../controllers/auth.controller'
import { authenticate } from '../middleware/auth'
import { validate } from '../middleware/auth'
import { loginSchema } from '../lib/schemas'
import rateLimit from 'express-rate-limit'
import { updateProfile, changePassword } from '../controllers/auth.controller'
import { changePasswordSchema } from '../lib/schemas'


const router = Router()

// Strict rate limit on login — 5 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: 'Too many login attempts. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

router.post('/login',   loginLimiter, validate(loginSchema), login)
router.post('/logout',  authenticate, logout)
router.post('/refresh', refresh)
router.get('/me',       authenticate, me)

router.put('/profile',         authenticate, updateProfile)
router.put('/change-password', authenticate, validate(changePasswordSchema), changePassword)

export default router
