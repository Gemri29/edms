import { Router } from 'express'
import { extractHandler } from '../controllers/ocr.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

router.use(authenticate)

router.post('/extract', extractHandler)

export default router
