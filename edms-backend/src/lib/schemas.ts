import { z } from 'zod'

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Accept DD/MM/YYYY string from frontend, convert to Date
const dateString = z
  .string()
  .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Date must be in DD/MM/YYYY format')
  .transform((val) => {
    const [day, month, year] = val.split('/')
    return new Date(`${year}-${month}-${day}`)
  })

const optionalDateString = z
  .string()
  .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Date must be in DD/MM/YYYY format')
  .transform((val) => {
    const [day, month, year] = val.split('/')
    return new Date(`${year}-${month}-${day}`)
  })
  .optional()
  .nullable()

// ─── Auth Schemas ─────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
})

// ─── User Schemas ─────────────────────────────────────────────────────────────

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  role: z.enum(['ADMIN', 'SUPER_ADMIN']),
  temporaryPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
})

export const updateUserSchema = z.object({
  role: z.enum(['ADMIN', 'SUPER_ADMIN']).optional(),
  isActive: z.boolean().optional(),
  fullName: z.string().min(2).optional(),
})

// ─── Employee Schemas ─────────────────────────────────────────────────────────

export const createEmployeeSchema = z.object({
  employeeNumber: z.string().min(1, 'Employee number is required'),
  designation: z.string().min(1, 'Designation is required'),
  lastName: z.string().min(1, 'Last name is required'),
  firstName: z.string().min(1, 'First name is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  birthdate: dateString,
  mobileNo: z
    .string()
    .min(7, 'Mobile number is required')
    .regex(/^\+?[0-9\s\-()]+$/, 'Invalid mobile number format'),
  email: z.string().email('Invalid email address'),

  // Optional document fields
  passportNo: z.string().optional().nullable(),
  passportExpiry: optionalDateString,
  laborCardNo: z.string().optional().nullable(),
  laborCardExpiry: optionalDateString,
  eidNo: z.string().optional().nullable(),
  eidExpiry: optionalDateString,
  uidNo: z.string().optional().nullable(),
  fileNo: z.string().optional().nullable(),
  visaExpiry: optionalDateString,
})

export const updateEmployeeSchema = createEmployeeSchema.partial().omit({
  employeeNumber: true,   // employee number cannot be changed after creation
})

export const employeeQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  search: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  designation: z.string().optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).default('ACTIVE'),
  expiryStatus: z.enum(['all', 'expiring', 'expired', 'valid']).default('all'),
  sortBy: z
    .enum([
      'lastName',
      'firstName',
      'employeeNumber',
      'designation',
      'passportExpiry',
      'laborCardExpiry',
      'eidExpiry',
      'visaExpiry',
      'createdAt',
    ])
    .default('lastName'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

// ─── OCR Schema ───────────────────────────────────────────────────────────────

export const ocrExtractSchema = z.object({
  documentType: z.enum(['PASSPORT', 'EMIRATES_ID', 'LABOR_CARD']),
})

// ─── Types ────────────────────────────────────────────────────────────────────

export type LoginInput = z.infer<typeof loginSchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>
export type EmployeeQuery = z.infer<typeof employeeQuerySchema>
