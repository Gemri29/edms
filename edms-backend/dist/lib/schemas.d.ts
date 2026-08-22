import { z } from 'zod';
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const changePasswordSchema: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
}, z.core.$strip>;
export declare const createUserSchema: z.ZodObject<{
    email: z.ZodString;
    fullName: z.ZodString;
    role: z.ZodEnum<{
        ADMIN: "ADMIN";
        SUPER_ADMIN: "SUPER_ADMIN";
    }>;
    temporaryPassword: z.ZodString;
}, z.core.$strip>;
export declare const updateUserSchema: z.ZodObject<{
    role: z.ZodOptional<z.ZodEnum<{
        ADMIN: "ADMIN";
        SUPER_ADMIN: "SUPER_ADMIN";
    }>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    fullName: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const createEmployeeSchema: z.ZodObject<{
    employeeNumber: z.ZodString;
    designation: z.ZodString;
    lastName: z.ZodString;
    firstName: z.ZodString;
    gender: z.ZodEnum<{
        FEMALE: "FEMALE";
        MALE: "MALE";
        OTHER: "OTHER";
    }>;
    birthdate: z.ZodPipe<z.ZodString, z.ZodTransform<Date, string>>;
    mobileNo: z.ZodString;
    email: z.ZodString;
    passportNo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    passportExpiry: z.ZodNullable<z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodTransform<Date, string>>>>;
    laborCardNo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    laborCardExpiry: z.ZodNullable<z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodTransform<Date, string>>>>;
    eidNo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    eidExpiry: z.ZodNullable<z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodTransform<Date, string>>>>;
    uidNo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    fileNo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    visaExpiry: z.ZodNullable<z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodTransform<Date, string>>>>;
}, z.core.$strip>;
export declare const updateEmployeeSchema: z.ZodObject<{
    designation: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    firstName: z.ZodOptional<z.ZodString>;
    gender: z.ZodOptional<z.ZodEnum<{
        FEMALE: "FEMALE";
        MALE: "MALE";
        OTHER: "OTHER";
    }>>;
    birthdate: z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodTransform<Date, string>>>;
    mobileNo: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    passportNo: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    passportExpiry: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodTransform<Date, string>>>>>;
    laborCardNo: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    laborCardExpiry: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodTransform<Date, string>>>>>;
    eidNo: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    eidExpiry: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodTransform<Date, string>>>>>;
    uidNo: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    fileNo: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    visaExpiry: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodTransform<Date, string>>>>>;
}, z.core.$strip>;
export declare const employeeQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    search: z.ZodOptional<z.ZodString>;
    gender: z.ZodOptional<z.ZodEnum<{
        FEMALE: "FEMALE";
        MALE: "MALE";
        OTHER: "OTHER";
    }>>;
    designation: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<{
        ACTIVE: "ACTIVE";
        ARCHIVED: "ARCHIVED";
    }>>;
    expiryStatus: z.ZodDefault<z.ZodEnum<{
        all: "all";
        expired: "expired";
        expiring: "expiring";
        valid: "valid";
    }>>;
    sortBy: z.ZodDefault<z.ZodEnum<{
        createdAt: "createdAt";
        designation: "designation";
        eidExpiry: "eidExpiry";
        employeeNumber: "employeeNumber";
        firstName: "firstName";
        laborCardExpiry: "laborCardExpiry";
        lastName: "lastName";
        passportExpiry: "passportExpiry";
        visaExpiry: "visaExpiry";
    }>>;
    sortOrder: z.ZodDefault<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>;
}, z.core.$strip>;
export declare const ocrExtractSchema: z.ZodObject<{
    documentType: z.ZodEnum<{
        EMIRATES_ID: "EMIRATES_ID";
        LABOR_CARD: "LABOR_CARD";
        PASSPORT: "PASSPORT";
    }>;
}, z.core.$strip>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type EmployeeQuery = z.infer<typeof employeeQuerySchema>;
//# sourceMappingURL=schemas.d.ts.map