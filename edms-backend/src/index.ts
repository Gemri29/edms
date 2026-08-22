import 'dotenv/config'
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import cron from 'node-cron'

import authRoutes     from './routes/auth.routes'
import employeeRoutes from './routes/employee.routes'
import userRoutes     from './routes/user.routes'
import ocrRoutes      from './routes/ocr.routes'

import { sendExpiryDigest }   from './services/notification.service'
import { purgeExpiredTokens } from './services/auth.service'

const app = express()
app.set('trust proxy', 1)   // Render sits behind one reverse proxy — trust its X-Forwarded-For

// ─── Security headers ─────────────────────────────────────────────────────────
app.use(helmet())

// ─── CORS — only allow the configured frontend origin ─────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true, // required for HTTP-only cookies
}))

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '6mb' })) // 6mb for base64 image uploads
app.use(cookieParser())

// ─── Global rate limit (100 req/min per IP) ───────────────────────────────────
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please slow down.' },
}))

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes)
app.use('/api/employees', employeeRoutes)
app.use('/api/users',     userRoutes)
app.use('/api/ocr',       ocrRoutes)

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found.' })
})

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[error]', err)
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred.'
      : err.message,
  })
})

// ─── Cron: daily expiry digest at 8:00 AM UAE time ───────────────────────────
cron.schedule(
  process.env.NOTIFICATION_CRON ?? '0 8 * * *',
  async () => {
    console.log('[cron] Running expiry notification digest...')
    try {
      await sendExpiryDigest()
    } catch (err) {
      console.error('[cron] Digest failed:', err)
    }
  },
  { timezone: 'Asia/Dubai' }
)

// ─── Cron: purge expired JWT blocklist entries at midnight ────────────────────
cron.schedule('0 0 * * *', async () => {
  console.log('[cron] Purging expired tokens...')
  try {
    await purgeExpiredTokens()
  } catch (err) {
    console.error('[cron] Purge failed:', err)
  }
})

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT ?? 3000)
app.listen(PORT, () => {
  console.log(`🚀 EDMS API running on http://localhost:${PORT}`)
  console.log(`   Environment: ${process.env.NODE_ENV ?? 'development'}`)
  console.log(`   Frontend:    ${process.env.FRONTEND_URL ?? 'http://localhost:5173'}`)
})

export default app
