import { Router, Request, Response } from 'express'
import { sendExpiryDigest } from '../services/notification.service'

const router = Router()

// ─── GET /api/cron/notify ──────────────────────────────────────────────────
// Triggered by an external scheduler (GitHub Actions / cron-job.org), NOT by
// a logged-in user, so it can't go through the normal JWT auth middleware.
// Protected instead by a shared secret passed as a header.
//
// Why this exists: node-cron runs inside the same process as the Express
// server. Render's free tier spins the whole service down after ~15 min of
// no HTTP traffic, so the in-process cron timer is asleep at 8am if nothing
// else has hit the service overnight. An external HTTP call both wakes the
// service up AND triggers the job — node-cron alone can't do either on free tier.

router.get('/notify', async (req: Request, res: Response): Promise<void> => {
  const secret = req.header('x-cron-secret')

  if (!process.env.CRON_SECRET) {
    console.error('[cron-endpoint] CRON_SECRET is not set — refusing all requests.')
    res.status(500).json({ success: false, error: 'Server misconfigured.' })
    return
  }

  if (secret !== process.env.CRON_SECRET) {
    res.status(401).json({ success: false, error: 'Unauthorized.' })
    return
  }

  try {
    console.log('[cron-endpoint] Triggered via external scheduler — running expiry digest...')
    await sendExpiryDigest()
    res.json({ success: true, message: 'Expiry digest sent.' })
  } catch (err) {
    console.error('[cron-endpoint] Digest failed:', err)
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

export default router