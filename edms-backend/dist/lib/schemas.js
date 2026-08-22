"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ocrExtractSchema = exports.employeeQuerySchema = exports.updateEmployeeSchema = exports.createEmployeeSchema = exports.updateUserSchema = exports.createUserSchema = exports.changePasswordSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
// ─── Helpers ──────────────────────────────────────────────────────────────────
// Accept DD/MM/YYYY string from frontend, convert to Date
const dateString = zod_1.z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Date must be in DD/MM/YYYY format')
    .transform((val) => {
    const [day, month, year] = val.split('/');
    return new Date(`${year}-${month}-${day}`);
});
const optionalDateString = zod_1.z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Date must be in DD/MM/YYYY format')
    .transform((val) => {
    const [day, month, year] = val.split('/');
    return new Date(`${year}-${month}-${day}`);
})
    .optional()
    .nullable();
// ─── Auth Schemas ─────────────────────────────────────────────────────────────
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Current password is required'),
    newPassword: zod_1.z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});
// ─── User Schemas ─────────────────────────────────────────────────────────────
exports.createUserSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    fullName: zod_1.z.string().min(2, 'Full name must be at least 2 characters'),
    role: zod_1.z.enum(['ADMIN', 'SUPER_ADMIN']),
    temporaryPassword: zod_1.z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Must contain uppercase')
        .regex(/[0-9]/, 'Must contain a number')
        .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
});
exports.updateUserSchema = zod_1.z.object({
    role: zod_1.z.enum(['ADMIN', 'SUPER_ADMIN']).optional(),
    isActive: zod_1.z.boolean().optional(),
    fullName: zod_1.z.string().min(2).optional(),
});
// ─── Employee Schemas ─────────────────────────────────────────────────────────
exports.createEmployeeSchema = zod_1.z.object({
    employeeNumber: zod_1.z.string().min(1, 'Employee number is required'),
    designation: zod_1.z.string().min(1, 'Designation is required'),
    lastName: zod_1.z.string().min(1, 'Last name is required'),
    firstName: zod_1.z.string().min(1, 'First name is required'),
    gender: zod_1.z.enum(['MALE', 'FEMALE', 'OTHER']),
    birthdate: dateString,
    mobileNo: zod_1.z
        .string()
        .min(7, 'Mobile number is required')
        .regex(/^\+?[0-9\s\-()]+$/, 'Invalid mobile number format'),
    email: zod_1.z.string().email('Invalid email address'),
    // Optional document fields
    passportNo: zod_1.z.string().optional().nullable(),
    passportExpiry: optionalDateString,
    laborCardNo: zod_1.z.string().optional().nullable(),
    laborCardExpiry: optionalDateString,
    eidNo: zod_1.z.string().optional().nullable(),
    eidExpiry: optionalDateString,
    uidNo: zod_1.z.string().optional().nullable(),
    fileNo: zod_1.z.string().optional().nullable(),
    visaExpiry: optionalDateString,
});
exports.updateEmployeeSchema = exports.createEmployeeSchema.partial().omit({
    employeeNumber: true, // employee number cannot be changed after creation
});
exports.employeeQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(25),
    search: zod_1.z.string().optional(),
    gender: zod_1.z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    designation: zod_1.z.string().optional(),
    status: zod_1.z.enum(['ACTIVE', 'ARCHIVED']).default('ACTIVE'),
    expiryStatus: zod_1.z.enum(['all', 'expiring', 'expired', 'valid']).default('all'),
    sortBy: zod_1.z
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
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('asc'),
});
// ─── OCR Schema ───────────────────────────────────────────────────────────────
exports.ocrExtractSchema = zod_1.z.object({
    documentType: zod_1.z.enum(['PASSPORT', 'EMIRATES_ID', 'LABOR_CARD']),
});
//# sourceMappingURL=schemas.js.map