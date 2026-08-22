import { Prisma, AuditAction, AuditEntity, EmployeeStatus } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { CreateEmployeeInput, UpdateEmployeeInput, EmployeeQuery } from '../lib/schemas'

// ─── Expiry window (6 months in ms) ──────────────────────────────────────────
const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000

// ─── Friendly error translation ───────────────────────────────────────────────
// Converts raw Prisma errors (schema mismatches, constraint violations, etc.)
// into clean, specific messages. Business-logic errors thrown with plain
// `Error` (e.g. "Employee not found") pass through untouched.
function toFriendlyError(err: unknown): Error {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        const target = (err.meta?.target as string[] | undefined)?.join(', ')
        return new Error(
          target
            ? `A record with this ${target} already exists.`
            : 'A record with this value already exists.'
        )
      }
      case 'P2025':
        return new Error('The record you tried to update no longer exists.')
      case 'P2003':
        return new Error('This action references a record that does not exist.')
      default:
        return new Error('A database error occurred while saving this record. Please try again.')
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    // This is what was happening with the entityId mismatch — a field/shape
    // sent to Prisma didn't match the schema. Surface something actionable
    // instead of the raw query dump.
    return new Error('The submitted data does not match the expected format. Please check all fields and try again.')
  }

  if (err instanceof Error) return err
  return new Error('An unexpected error occurred. Please try again.')
}

// ─── Fields to select (never return raw sensitive fields as-is in lists) ─────
const employeeSelect = {
  id: true,
  employeeNumber: true,
  designation: true,
  designationEid: true,       
  lastName: true,
  firstName: true,
  gender: true,
  birthdate: true,
  mobileNo: true,
  email: true,
  passportNo: true,
  passportExpiry: true,
  laborCardNo: true,
  laborCardExpiry: true,
  eidNo: true,
  eidExpiry: true,
  uidNo: true,
  fileNo: true,
  visaExpiry: true,
  basicSalary: true,           
  housingSalary: true,         
  transpoAllowance: true,      
  totalSalary: true,           
  status: true,
  createdAt: true,
  updatedAt: true,
  archivedAt: true,
  createdBy: { select: { id: true, fullName: true } },
  updatedBy: { select: { id: true, fullName: true } },
} satisfies Prisma.EmployeeSelect

// ─── Build expiry filter ──────────────────────────────────────────────────────

function buildExpiryFilter(expiryStatus: string): Prisma.EmployeeWhereInput {
  const now = new Date()
  const sixMonthsFromNow = new Date(now.getTime() + SIX_MONTHS_MS)
  const expiryFields = ['passportExpiry', 'laborCardExpiry', 'eidExpiry', 'visaExpiry'] as const

  if (expiryStatus === 'expired') {
    return {
      OR: expiryFields.map((f) => ({ [f]: { lt: now } })),
    }
  }

  if (expiryStatus === 'expiring') {
    return {
      OR: expiryFields.map((f) => ({
        [f]: { gte: now, lte: sixMonthsFromNow },
      })),
    }
  }

  if (expiryStatus === 'valid') {
    return {
      AND: expiryFields.map((f) => ({
        OR: [{ [f]: null }, { [f]: { gt: sixMonthsFromNow } }],
      })),
    }
  }

  return {}
}

// ─── List Employees ───────────────────────────────────────────────────────────

export async function listEmployees(query: EmployeeQuery) {
  const {
    page, limit, search, gender, designation,
    status, expiryStatus, sortBy, sortOrder,
  } = query

  const skip = (page - 1) * limit

  const where: Prisma.EmployeeWhereInput = {
    status: status as EmployeeStatus,
    ...(search && {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { employeeNumber: { contains: search, mode: 'insensitive' } },
        { designation: { contains: search, mode: 'insensitive' } },
      ],
    }),
    ...(gender && { gender: gender }),
    ...(designation && { designation: { contains: designation, mode: 'insensitive' } }),
    ...buildExpiryFilter(expiryStatus),
  }

  try {
    const [employees, total] = await prisma.$transaction([
      prisma.employee.findMany({
        where,
        select: employeeSelect,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.employee.count({ where }),
    ])

    return {
      data: employees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  } catch (err) {
    throw toFriendlyError(err)
  }
}

// ─── Get Single Employee ──────────────────────────────────────────────────────

export async function getEmployee(id: string) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id },
      select: {
        ...employeeSelect,
        auditLogs: {
          orderBy: { changedAt: 'desc' },
          take: 50,
          select: {
            id: true,
            action: true,
            changedAt: true,
            previousValue: true,
            newValue: true,
            changedBy: { select: { id: true, fullName: true } },
          },
        },
      },
    })

    if (!employee) throw new Error('Employee not found')
    return employee
  } catch (err) {
    throw toFriendlyError(err)
  }
}

// ─── Create Employee ──────────────────────────────────────────────────────────

export async function createEmployee(
  data: CreateEmployeeInput,
  createdById: string
) {
  // Check for duplicate employee number
  const existing = await prisma.employee.findUnique({
    where: { employeeNumber: data.employeeNumber },
  })
  if (existing) {
    throw new Error(`Employee number "${data.employeeNumber}" is already in use.`)
  }

  try {
    const employee = await prisma.employee.create({
      data: {
        ...data,
        createdById,
        updatedById: createdById,
      },
      select: employeeSelect,
    })

    // Write audit log
    await prisma.auditLog.create({
      data: {
        entityType: AuditEntity.EMPLOYEE,
        employeeId: employee.id,
        action: AuditAction.CREATE,
        changedById: createdById,
        newValue: data as unknown as Prisma.InputJsonValue,
      },
    })

    return employee
  } catch (err) {
    throw toFriendlyError(err)
  }
}

// ─── Update Employee ──────────────────────────────────────────────────────────

export async function updateEmployee(
  id: string,
  data: UpdateEmployeeInput,
  updatedById: string
) {
  const existing = await prisma.employee.findUnique({ where: { id } })
  if (!existing) throw new Error('Employee not found')
  if (existing.status === EmployeeStatus.ARCHIVED) {
    throw new Error('Archived employee records cannot be edited. Restore first.')
  }

  try {
    const employee = await prisma.employee.update({
      where: { id },
      data: { ...data, updatedById },
      select: employeeSelect,
    })

    // Write field-level diff to audit log
    const changedFields: Record<string, { from: unknown; to: unknown }> = {}
    for (const key of Object.keys(data) as (keyof UpdateEmployeeInput)[]) {
      const prev = existing[key as keyof typeof existing]
      const next = data[key]
      if (String(prev) !== String(next)) {
        changedFields[key] = { from: prev, to: next }
      }
    }

    await prisma.auditLog.create({
      data: {
        entityType: AuditEntity.EMPLOYEE,
        employeeId: id,
        action: AuditAction.UPDATE,
        changedById: updatedById,
        previousValue: changedFields as unknown as Prisma.InputJsonValue,
        newValue: data as unknown as Prisma.InputJsonValue,
      },
    })

    return employee
  } catch (err) {
    throw toFriendlyError(err)
  }
}

// ─── Archive Employee ─────────────────────────────────────────────────────────

export async function archiveEmployee(id: string, changedById: string) {
  const existing = await prisma.employee.findUnique({ where: { id } })
  if (!existing) throw new Error('Employee not found')
  if (existing.status === EmployeeStatus.ARCHIVED) {
    throw new Error('Employee is already archived.')
  }

  try {
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        status: EmployeeStatus.ARCHIVED,
        archivedAt: new Date(),
        updatedById: changedById,
      },
      select: employeeSelect,
    })

    await prisma.auditLog.create({
      data: {
        entityType: AuditEntity.EMPLOYEE,
        employeeId: id,
        action: AuditAction.ARCHIVE,
        changedById,
      },
    })

    return employee
  } catch (err) {
    throw toFriendlyError(err)
  }
}

// ─── Restore Employee ─────────────────────────────────────────────────────────

export async function restoreEmployee(id: string, changedById: string) {
  const existing = await prisma.employee.findUnique({ where: { id } })
  if (!existing) throw new Error('Employee not found')
  if (existing.status === EmployeeStatus.ACTIVE) {
    throw new Error('Employee is already active.')
  }

  try {
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        status: EmployeeStatus.ACTIVE,
        archivedAt: null,
        updatedById: changedById,
      },
      select: employeeSelect,
    })

    await prisma.auditLog.create({
      data: {
        entityType: AuditEntity.EMPLOYEE,
        employeeId: id,
        action: AuditAction.RESTORE,
        changedById,
      },
    })

    return employee
  } catch (err) {
    throw toFriendlyError(err)
  }
}

// ─── Hard Delete (Super Admin only) ──────────────────────────────────────────

export async function deleteEmployee(id: string, changedById: string) {
  const existing = await prisma.employee.findUnique({ where: { id } })
  if (!existing) throw new Error('Employee not found')

  try {
    // Log before deleting so the audit entry still makes sense
    await prisma.auditLog.create({
      data: {
        entityType: AuditEntity.EMPLOYEE,
        employeeId: id,
        action: AuditAction.DELETE,
        changedById,
        previousValue: existing as unknown as Prisma.InputJsonValue,
      },
    })

    await prisma.employee.delete({ where: { id } })
  } catch (err) {
    throw toFriendlyError(err)
  }
}

// ─── Notification query (used by cron job) ────────────────────────────────────

export async function getExpiringEmployees() {
  const now = new Date()
  const sixMonthsFromNow = new Date(now.getTime() + SIX_MONTHS_MS)

  return prisma.employee.findMany({
    where: {
      status: EmployeeStatus.ACTIVE,
      OR: [
        { passportExpiry: { gte: now, lte: sixMonthsFromNow } },
        { laborCardExpiry: { gte: now, lte: sixMonthsFromNow } },
        { eidExpiry: { gte: now, lte: sixMonthsFromNow } },
        { visaExpiry: { gte: now, lte: sixMonthsFromNow } },
        { passportExpiry: { lt: now } },
        { laborCardExpiry: { lt: now } },
        { eidExpiry: { lt: now } },
        { visaExpiry: { lt: now } },
      ],
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      employeeNumber: true,
      passportExpiry: true,
      laborCardExpiry: true,
      eidExpiry: true,
      visaExpiry: true,
    },
  })
}