import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'
import { JwtPayload } from '../types'
import { Role } from '@prisma/client'

const ACCESS_TOKEN_EXPIRES = process.env.JWT_EXPIRES_IN ?? '15m'
const REFRESH_TOKEN_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES_IN ?? '7d'

// ─── Token Helpers ────────────────────────────────────────────────────────────

export function signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: ACCESS_TOKEN_EXPIRES,
  } as jwt.SignOptions)
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId }, process.env.REFRESH_TOKEN_SECRET!, {
    expiresIn: REFRESH_TOKEN_EXPIRES,
  } as jwt.SignOptions)
}

function msFromExpiry(exp: string): number {
  const unit = exp.slice(-1)
  const value = parseInt(exp.slice(0, -1))
  const map: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 }
  return value * (map[unit] ?? 60000)
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })

  // Generic error — don't reveal whether email exists
  const invalidCredentials = new Error('Invalid email or password')

  if (!user) throw invalidCredentials
  if (!user.isActive) throw new Error('Your account has been deactivated. Contact a Super Admin.')

  const passwordValid = await bcrypt.compare(password, user.passwordHash)
  if (!passwordValid) throw invalidCredentials

  // Update last login timestamp
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })

  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role })
  const refreshToken = signRefreshToken(user.id)

  return {
    accessToken,
    refreshToken,
    mustChangePw: user.mustChangePw,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
  }
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logoutUser(token: string): Promise<void> {
  // Decode without verifying to get expiry (it may already be expired)
  const decoded = jwt.decode(token) as JwtPayload | null
  const expiresAt = decoded?.exp
    ? new Date(decoded.exp * 1000)
    : new Date(Date.now() + msFromExpiry(ACCESS_TOKEN_EXPIRES))

  await prisma.tokenBlocklist.create({
    data: { token, userId: decoded?.sub ?? 'unknown', expiresAt },
  })
}

// ─── Refresh Token ────────────────────────────────────────────────────────────

export async function refreshAccessToken(refreshToken: string) {
  let payload: { sub: string }
  try {
    payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as { sub: string }
  } catch {
    throw new Error('Invalid or expired refresh token')
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } })
  if (!user || !user.isActive) throw new Error('User not found or deactivated')

  const newAccessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  })

  return { accessToken: newAccessToken }
}

// ─── Hash password ────────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

// ─── Clean up expired blocklist entries (run in cron) ────────────────────────

export async function purgeExpiredTokens(): Promise<void> {
  await prisma.tokenBlocklist.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  })
}
