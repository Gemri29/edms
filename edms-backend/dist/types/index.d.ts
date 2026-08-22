import { Request } from 'express';
import { Role } from '@prisma/client';
export interface JwtPayload {
    sub: string;
    email: string;
    role: Role;
    iat?: number;
    exp?: number;
}
export interface AuthenticatedRequest extends Request {
    user: JwtPayload;
}
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export type SortField = 'lastName' | 'firstName' | 'employeeNumber' | 'designation' | 'passportExpiry' | 'laborCardExpiry' | 'eidExpiry' | 'visaExpiry' | 'createdAt';
export type SortOrder = 'asc' | 'desc';
export type ExpiryStatus = 'all' | 'expiring' | 'expired' | 'valid';
//# sourceMappingURL=index.d.ts.map