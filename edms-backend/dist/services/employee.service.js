"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listEmployees = listEmployees;
exports.getEmployee = getEmployee;
exports.createEmployee = createEmployee;
exports.updateEmployee = updateEmployee;
exports.archiveEmployee = archiveEmployee;
exports.restoreEmployee = restoreEmployee;
exports.deleteEmployee = deleteEmployee;
exports.getExpiringEmployees = getExpiringEmployees;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
// ─── Expiry window (6 months in ms) ──────────────────────────────────────────
const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;
// ─── Fields to select (never return raw sensitive fields as-is in lists) ─────
const employeeSelect = {
    id: true,
    employeeNumber: true,
    designation: true,
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
    status: true,
    createdAt: true,
    updatedAt: true,
    archivedAt: true,
    createdBy: { select: { id: true, fullName: true } },
    updatedBy: { select: { id: true, fullName: true } },
};
// ─── Build expiry filter ──────────────────────────────────────────────────────
function buildExpiryFilter(expiryStatus) {
    const now = new Date();
    const sixMonthsFromNow = new Date(now.getTime() + SIX_MONTHS_MS);
    const expiryFields = ['passportExpiry', 'laborCardExpiry', 'eidExpiry', 'visaExpiry'];
    if (expiryStatus === 'expired') {
        return {
            OR: expiryFields.map((f) => ({ [f]: { lt: now } })),
        };
    }
    if (expiryStatus === 'expiring') {
        return {
            OR: expiryFields.map((f) => ({
                [f]: { gte: now, lte: sixMonthsFromNow },
            })),
        };
    }
    if (expiryStatus === 'valid') {
        return {
            AND: expiryFields.map((f) => ({
                OR: [{ [f]: null }, { [f]: { gt: sixMonthsFromNow } }],
            })),
        };
    }
    return {};
}
// ─── List Employees ───────────────────────────────────────────────────────────
async function listEmployees(query) {
    const { page, limit, search, gender, designation, status, expiryStatus, sortBy, sortOrder, } = query;
    const skip = (page - 1) * limit;
    const where = {
        status: status,
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
    };
    const [employees, total] = await prisma_1.prisma.$transaction([
        prisma_1.prisma.employee.findMany({
            where,
            select: employeeSelect,
            orderBy: { [sortBy]: sortOrder },
            skip,
            take: limit,
        }),
        prisma_1.prisma.employee.count({ where }),
    ]);
    return {
        data: employees,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}
// ─── Get Single Employee ──────────────────────────────────────────────────────
async function getEmployee(id) {
    const employee = await prisma_1.prisma.employee.findUnique({
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
    });
    if (!employee)
        throw new Error('Employee not found');
    return employee;
}
// ─── Create Employee ──────────────────────────────────────────────────────────
async function createEmployee(data, createdById) {
    // Check for duplicate employee number
    const existing = await prisma_1.prisma.employee.findUnique({
        where: { employeeNumber: data.employeeNumber },
    });
    if (existing) {
        throw new Error(`Employee number "${data.employeeNumber}" is already in use.`);
    }
    const employee = await prisma_1.prisma.employee.create({
        data: {
            ...data,
            createdById,
            updatedById: createdById,
        },
        select: employeeSelect,
    });
    // Write audit log
    await prisma_1.prisma.auditLog.create({
        data: {
            entityType: client_1.AuditEntity.EMPLOYEE,
            entityId: employee.id,
            action: client_1.AuditAction.CREATE,
            changedById: createdById,
            newValue: data,
        },
    });
    return employee;
}
// ─── Update Employee ──────────────────────────────────────────────────────────
async function updateEmployee(id, data, updatedById) {
    const existing = await prisma_1.prisma.employee.findUnique({ where: { id } });
    if (!existing)
        throw new Error('Employee not found');
    if (existing.status === client_1.EmployeeStatus.ARCHIVED) {
        throw new Error('Archived employee records cannot be edited. Restore first.');
    }
    const employee = await prisma_1.prisma.employee.update({
        where: { id },
        data: { ...data, updatedById },
        select: employeeSelect,
    });
    // Write field-level diff to audit log
    const changedFields = {};
    for (const key of Object.keys(data)) {
        const prev = existing[key];
        const next = data[key];
        if (String(prev) !== String(next)) {
            changedFields[key] = { from: prev, to: next };
        }
    }
    await prisma_1.prisma.auditLog.create({
        data: {
            entityType: client_1.AuditEntity.EMPLOYEE,
            entityId: id,
            action: client_1.AuditAction.UPDATE,
            changedById: updatedById,
            previousValue: changedFields,
            newValue: data,
        },
    });
    return employee;
}
// ─── Archive Employee ─────────────────────────────────────────────────────────
async function archiveEmployee(id, changedById) {
    const existing = await prisma_1.prisma.employee.findUnique({ where: { id } });
    if (!existing)
        throw new Error('Employee not found');
    if (existing.status === client_1.EmployeeStatus.ARCHIVED) {
        throw new Error('Employee is already archived.');
    }
    const employee = await prisma_1.prisma.employee.update({
        where: { id },
        data: {
            status: client_1.EmployeeStatus.ARCHIVED,
            archivedAt: new Date(),
            updatedById: changedById,
        },
        select: employeeSelect,
    });
    await prisma_1.prisma.auditLog.create({
        data: {
            entityType: client_1.AuditEntity.EMPLOYEE,
            entityId: id,
            action: client_1.AuditAction.ARCHIVE,
            changedById,
        },
    });
    return employee;
}
// ─── Restore Employee ─────────────────────────────────────────────────────────
async function restoreEmployee(id, changedById) {
    const existing = await prisma_1.prisma.employee.findUnique({ where: { id } });
    if (!existing)
        throw new Error('Employee not found');
    if (existing.status === client_1.EmployeeStatus.ACTIVE) {
        throw new Error('Employee is already active.');
    }
    const employee = await prisma_1.prisma.employee.update({
        where: { id },
        data: {
            status: client_1.EmployeeStatus.ACTIVE,
            archivedAt: null,
            updatedById: changedById,
        },
        select: employeeSelect,
    });
    await prisma_1.prisma.auditLog.create({
        data: {
            entityType: client_1.AuditEntity.EMPLOYEE,
            entityId: id,
            action: client_1.AuditAction.RESTORE,
            changedById,
        },
    });
    return employee;
}
// ─── Hard Delete (Super Admin only) ──────────────────────────────────────────
async function deleteEmployee(id, changedById) {
    const existing = await prisma_1.prisma.employee.findUnique({ where: { id } });
    if (!existing)
        throw new Error('Employee not found');
    // Log before deleting so the audit entry still makes sense
    await prisma_1.prisma.auditLog.create({
        data: {
            entityType: client_1.AuditEntity.EMPLOYEE,
            entityId: id,
            action: client_1.AuditAction.DELETE,
            changedById,
            previousValue: existing,
        },
    });
    await prisma_1.prisma.employee.delete({ where: { id } });
}
// ─── Notification query (used by cron job) ────────────────────────────────────
async function getExpiringEmployees() {
    const now = new Date();
    const sixMonthsFromNow = new Date(now.getTime() + SIX_MONTHS_MS);
    return prisma_1.prisma.employee.findMany({
        where: {
            status: client_1.EmployeeStatus.ACTIVE,
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
    });
}
//# sourceMappingURL=employee.service.js.map