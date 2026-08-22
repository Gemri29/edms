import { Request } from 'express'
import { Role } from '@prisma/client'

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string       // user id
  email: string
  role: Role
  iat?: number
  exp?: number
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ─── Employee Filters ─────────────────────────────────────────────────────────

export type SortField =
  | 'lastName'
  | 'firstName'
  | 'employeeNumber'
  | 'designation'
  | 'passportExpiry'
  | 'laborCardExpiry'
  | 'eidExpiry'
  | 'visaExpiry'
  | 'createdAt'

export type SortOrder = 'asc' | 'desc'

export type ExpiryStatus = 'all' | 'expiring' | 'expired' | 'valid'
