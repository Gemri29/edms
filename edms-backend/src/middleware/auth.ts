import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { Role } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { JwtPayload, AuthenticatedRequest } from '../types'

// ─── Verify JWT from HTTP-only cookie ────────────────────────────────────────

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.cookies?.access_token

    if (!token) {
      res.status(401).json({ success: false, error: 'Authentication required' })
      return
    }

    // Check token blocklist (handles explicit logout)
    const blocked = await prisma.tokenBlocklist.findUnique({
      where: { token },
    })
    if (blocked) {
      res.status(401).json({ success: false, error: 'Session expired. Please sign in again.' })
      return
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload

    ;(req as AuthenticatedRequest).user = payload
    next()
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, error: 'Session expired. Please sign in again.' })
    } else {
      res.status(401).json({ success: false, error: 'Invalid session.' })
    }
  }
}

// ─── Super Admin only guard ───────────────────────────────────────────────────

export function requireSuperAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const user = (req as AuthenticatedRequest).user

  if (!user || user.role !== Role.SUPER_ADMIN) {
    res.status(403).json({
      success: false,
      error: 'Access denied. Super Admin privileges required.',
    })
    return
  }

  next()
}

// ─── Zod input validator factory ─────────────────────────────────────────────

import { ZodSchema } from 'zod'

export function validate(schema: ZodSchema, source: 'body' | 'query' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(source === 'body' ? req.body : req.query)

    if (!result.success) {
      res.status(422).json({
        success: false,
        error: 'Validation failed',
        details: result.error.flatten().fieldErrors,
      })
      return
    }

    if (source === 'body') {
      req.body = result.data
    } else {
      ;(req as Request & { validatedQuery?: unknown }).validatedQuery = result.data
    }

    next()
  }
}
