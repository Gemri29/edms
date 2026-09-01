import { Request, Response } from 'express'
import { loginUser, logoutUser, refreshAccessToken } from '../services/auth.service'
import { AuthenticatedRequest } from '../types'
import { verifyPassword, hashPassword } from '../services/auth.service'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

const IS_PROD = process.env.NODE_ENV === 'production'

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: (IS_PROD ? 'none' : 'lax') as 'none' | 'lax',
  path: '/',
}

const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
})

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

// ─── PUT /api/auth/profile ────────────────────────────────────────────────────
export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user
    const parsed = updateProfileSchema.safeParse(req.body)

    if (!parsed.success) {
      res.status(422).json({ success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors })
      return
    }

    const { fullName, email } = parsed.data

    // Check email not already taken by another user
    if (email) {
      const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
      if (existing && existing.id !== user.sub) {
        res.status(409).json({ success: false, error: 'This email is already in use by another account.' })
        return
      }
    }

    const updated = await prisma.user.update({
      where: { id: user.sub },
      data: {
        ...(fullName && { fullName }),
        ...(email && { email: email.toLowerCase() }),
      },
      select: { id: true, email: true, fullName: true, role: true },
    })

    res.json({ success: true, data: { user: updated }, message: 'Profile updated successfully.' })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
}

// ─── PUT /api/auth/change-password ───────────────────────────────────────────
export async function changePassword(req: Request, res: Response): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user
    const { currentPassword, newPassword } = req.body

    const dbUser = await prisma.user.findUnique({ where: { id: user.sub } })
    if (!dbUser) {
      res.status(404).json({ success: false, error: 'User not found.' })
      return
    }

    const valid = await verifyPassword(currentPassword, dbUser.passwordHash)
    if (!valid) {
      res.status(401).json({ success: false, error: 'Current password is incorrect.' })
      return
    }

    if (currentPassword === newPassword) {
      res.status(422).json({ success: false, error: 'New password must be different from your current password.' })
      return
    }

    const newHash = await hashPassword(newPassword)
    await prisma.user.update({
      where: { id: user.sub },
      data: { passwordHash: newHash, mustChangePw: false },
    })

    res.json({ success: true, message: 'Password changed successfully.' })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
}

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

export async function me(req: Request, res: Response): Promise<void> {
  const user = (req as AuthenticatedRequest).user
  res.json({ success: true, data: { user } })
}
