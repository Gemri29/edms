import { Request, Response } from 'express'
import { loginUser, logoutUser, refreshAccessToken } from '../services/auth.service'
import { AuthenticatedRequest } from '../types'

const IS_PROD = process.env.NODE_ENV === 'production'

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: 'strict' as const,
  path: '/',
}

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body
    const result = await loginUser(email, password)

    res.cookie('access_token', result.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000, // 15 minutes
    })

    res.cookie('refresh_token', result.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })

    res.json({
      success: true,
      data: {
        user: result.user,
        mustChangePw: result.mustChangePw,
      },
    })
  } catch (err) {
    res.status(401).json({ success: false, error: (err as Error).message })
  }
}

// ─── POST /api/auth/logout ────────────────────────────────────────────────────

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    const token = req.cookies?.access_token
    if (token) await logoutUser(token)

    res.clearCookie('access_token', COOKIE_OPTIONS)
    res.clearCookie('refresh_token', COOKIE_OPTIONS)
    res.json({ success: true, message: 'Logged out successfully.' })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
}

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────

export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const refreshToken = req.cookies?.refresh_token
    if (!refreshToken) {
      res.status(401).json({ success: false, error: 'No refresh token provided.' })
      return
    }

    const { accessToken } = await refreshAccessToken(refreshToken)

    res.cookie('access_token', accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000,
    })

    res.json({ success: true, message: 'Token refreshed.' })
  } catch (err) {
    res.status(401).json({ success: false, error: (err as Error).message })
  }
}

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

export async function me(req: Request, res: Response): Promise<void> {
  const user = (req as AuthenticatedRequest).user
  res.json({ success: true, data: { user } })
}
