import { prisma } from '../lib/prisma'
import { hashPassword } from './auth.service'
import { CreateUserInput, UpdateUserInput } from '../lib/schemas'
import { AuditAction, AuditEntity, Prisma } from '@prisma/client'

// ─── List all users ───────────────────────────────────────────────────────────

export async function listUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  })
}

// ─── Get single user ──────────────────────────────────────────────────────────

export async function getUser(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  })
  if (!user) throw new Error('User not found')
  return user
}

// ─── Create user ──────────────────────────────────────────────────────────────

export async function createUser(data: CreateUserInput, createdById: string) {
  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  })
  if (existing) throw new Error(`An account with email "${data.email}" already exists.`)

  const passwordHash = await hashPassword(data.temporaryPassword)

  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      fullName: data.fullName,
      role: data.role,
      passwordHash,
      mustChangePw: true,
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  })

  await prisma.auditLog.create({
    data: {
      entityType: AuditEntity.USER,
      userId: user.id,
      action: AuditAction.CREATE,
      changedById: createdById,
      newValue: { email: user.email, role: user.role } as Prisma.InputJsonValue,
    },
  })

  return user
}

// ─── Update user (role or status) ────────────────────────────────────────────

export async function updateUser(
  id: string,
  data: UpdateUserInput,
  updatedById: string
) {
  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) throw new Error('User not found')

  // Prevent Super Admin from deactivating themselves
  if (id === updatedById && data.isActive === false) {
    throw new Error('You cannot deactivate your own account.')
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  })

  await prisma.auditLog.create({
    data: {
      entityType: AuditEntity.USER,
      userId: id,
      action: AuditAction.UPDATE,
      changedById: updatedById,
      previousValue: {
        role: existing.role,
        isActive: existing.isActive,
      } as Prisma.InputJsonValue,
      newValue: data as Prisma.InputJsonValue,
    },
  })

  return user
}

// ─── Deactivate user ──────────────────────────────────────────────────────────

export async function deactivateUser(id: string, deactivatedById: string) {
  if (id === deactivatedById) {
    throw new Error('You cannot deactivate your own account.')
  }

  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) throw new Error('User not found')
  if (!existing.isActive) throw new Error('User is already inactive.')

  const user = await prisma.user.update({
    where: { id },
    data: { isActive: false },
    select: { id: true, email: true, fullName: true, role: true, isActive: true },
  })

  await prisma.auditLog.create({
    data: {
      entityType: AuditEntity.USER,
      userId: id,
      action: AuditAction.UPDATE,
      changedById: deactivatedById,
      previousValue: { isActive: true } as Prisma.InputJsonValue,
      newValue: { isActive: false } as Prisma.InputJsonValue,
    },
  })

  return user
}