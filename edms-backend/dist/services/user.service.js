"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers = listUsers;
exports.getUser = getUser;
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.deactivateUser = deactivateUser;
const prisma_1 = require("../lib/prisma");
const auth_service_1 = require("./auth.service");
const client_1 = require("@prisma/client");
// ─── List all users ───────────────────────────────────────────────────────────
async function listUsers() {
    return prisma_1.prisma.user.findMany({
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
    });
}
// ─── Get single user ──────────────────────────────────────────────────────────
async function getUser(id) {
    const user = await prisma_1.prisma.user.findUnique({
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
    });
    if (!user)
        throw new Error('User not found');
    return user;
}
// ─── Create user ──────────────────────────────────────────────────────────────
async function createUser(data, createdById) {
    const existing = await prisma_1.prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
    });
    if (existing)
        throw new Error(`An account with email "${data.email}" already exists.`);
    const passwordHash = await (0, auth_service_1.hashPassword)(data.temporaryPassword);
    const user = await prisma_1.prisma.user.create({
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
    });
    await prisma_1.prisma.auditLog.create({
        data: {
            entityType: client_1.AuditEntity.USER,
            entityId: user.id,
            action: client_1.AuditAction.CREATE,
            changedById: createdById,
            newValue: { email: user.email, role: user.role },
        },
    });
    return user;
}
// ─── Update user (role or status) ────────────────────────────────────────────
async function updateUser(id, data, updatedById) {
    const existing = await prisma_1.prisma.user.findUnique({ where: { id } });
    if (!existing)
        throw new Error('User not found');
    // Prevent Super Admin from deactivating themselves
    if (id === updatedById && data.isActive === false) {
        throw new Error('You cannot deactivate your own account.');
    }
    const user = await prisma_1.prisma.user.update({
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
    });
    await prisma_1.prisma.auditLog.create({
        data: {
            entityType: client_1.AuditEntity.USER,
            entityId: id,
            action: client_1.AuditAction.UPDATE,
            changedById: updatedById,
            previousValue: {
                role: existing.role,
                isActive: existing.isActive,
            },
            newValue: data,
        },
    });
    return user;
}
// ─── Deactivate user ──────────────────────────────────────────────────────────
async function deactivateUser(id, deactivatedById) {
    if (id === deactivatedById) {
        throw new Error('You cannot deactivate your own account.');
    }
    const existing = await prisma_1.prisma.user.findUnique({ where: { id } });
    if (!existing)
        throw new Error('User not found');
    if (!existing.isActive)
        throw new Error('User is already inactive.');
    const user = await prisma_1.prisma.user.update({
        where: { id },
        data: { isActive: false },
        select: { id: true, email: true, fullName: true, role: true, isActive: true },
    });
    await prisma_1.prisma.auditLog.create({
        data: {
            entityType: client_1.AuditEntity.USER,
            entityId: id,
            action: client_1.AuditAction.UPDATE,
            changedById: deactivatedById,
            previousValue: { isActive: true },
            newValue: { isActive: false },
        },
    });
    return user;
}
//# sourceMappingURL=user.service.js.map