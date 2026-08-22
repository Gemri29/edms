import { Prisma } from '@prisma/client';
import { CreateEmployeeInput, UpdateEmployeeInput, EmployeeQuery } from '../lib/schemas';
export declare function listEmployees(query: EmployeeQuery): Promise<{
    data: {
        archivedAt: Date | null;
        birthdate: Date;
        createdAt: Date;
        createdBy: {
            fullName: string;
            id: string;
        } | null;
        designation: string;
        eidExpiry: Date | null;
        eidNo: string | null;
        email: string;
        employeeNumber: string;
        fileNo: string | null;
        firstName: string;
        gender: import(".prisma/client").$Enums.Gender;
        id: string;
        laborCardExpiry: Date | null;
        laborCardNo: string | null;
        lastName: string;
        mobileNo: string;
        passportExpiry: Date | null;
        passportNo: string | null;
        status: import(".prisma/client").$Enums.EmployeeStatus;
        uidNo: string | null;
        updatedAt: Date;
        updatedBy: {
            fullName: string;
            id: string;
        } | null;
        visaExpiry: Date | null;
    }[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}>;
export declare function getEmployee(id: string): Promise<{
    archivedAt: Date | null;
    auditLogs: {
        action: import(".prisma/client").$Enums.AuditAction;
        changedAt: Date;
        changedBy: {
            fullName: string;
            id: string;
        };
        id: string;
        newValue: Prisma.JsonValue;
        previousValue: Prisma.JsonValue;
    }[];
    birthdate: Date;
    createdAt: Date;
    createdBy: {
        fullName: string;
        id: string;
    } | null;
    designation: string;
    eidExpiry: Date | null;
    eidNo: string | null;
    email: string;
    employeeNumber: string;
    fileNo: string | null;
    firstName: string;
    gender: import(".prisma/client").$Enums.Gender;
    id: string;
    laborCardExpiry: Date | null;
    laborCardNo: string | null;
    lastName: string;
    mobileNo: string;
    passportExpiry: Date | null;
    passportNo: string | null;
    status: import(".prisma/client").$Enums.EmployeeStatus;
    uidNo: string | null;
    updatedAt: Date;
    updatedBy: {
        fullName: string;
        id: string;
    } | null;
    visaExpiry: Date | null;
}>;
export declare function createEmployee(data: CreateEmployeeInput, createdById: string): Promise<{
    archivedAt: Date | null;
    birthdate: Date;
    createdAt: Date;
    createdBy: {
        fullName: string;
        id: string;
    } | null;
    designation: string;
    eidExpiry: Date | null;
    eidNo: string | null;
    email: string;
    employeeNumber: string;
    fileNo: string | null;
    firstName: string;
    gender: import(".prisma/client").$Enums.Gender;
    id: string;
    laborCardExpiry: Date | null;
    laborCardNo: string | null;
    lastName: string;
    mobileNo: string;
    passportExpiry: Date | null;
    passportNo: string | null;
    status: import(".prisma/client").$Enums.EmployeeStatus;
    uidNo: string | null;
    updatedAt: Date;
    updatedBy: {
        fullName: string;
        id: string;
    } | null;
    visaExpiry: Date | null;
}>;
export declare function updateEmployee(id: string, data: UpdateEmployeeInput, updatedById: string): Promise<{
    archivedAt: Date | null;
    birthdate: Date;
    createdAt: Date;
    createdBy: {
        fullName: string;
        id: string;
    } | null;
    designation: string;
    eidExpiry: Date | null;
    eidNo: string | null;
    email: string;
    employeeNumber: string;
    fileNo: string | null;
    firstName: string;
    gender: import(".prisma/client").$Enums.Gender;
    id: string;
    laborCardExpiry: Date | null;
    laborCardNo: string | null;
    lastName: string;
    mobileNo: string;
    passportExpiry: Date | null;
    passportNo: string | null;
    status: import(".prisma/client").$Enums.EmployeeStatus;
    uidNo: string | null;
    updatedAt: Date;
    updatedBy: {
        fullName: string;
        id: string;
    } | null;
    visaExpiry: Date | null;
}>;
export declare function archiveEmployee(id: string, changedById: string): Promise<{
    archivedAt: Date | null;
    birthdate: Date;
    createdAt: Date;
    createdBy: {
        fullName: string;
        id: string;
    } | null;
    designation: string;
    eidExpiry: Date | null;
    eidNo: string | null;
    email: string;
    employeeNumber: string;
    fileNo: string | null;
    firstName: string;
    gender: import(".prisma/client").$Enums.Gender;
    id: string;
    laborCardExpiry: Date | null;
    laborCardNo: string | null;
    lastName: string;
    mobileNo: string;
    passportExpiry: Date | null;
    passportNo: string | null;
    status: import(".prisma/client").$Enums.EmployeeStatus;
    uidNo: string | null;
    updatedAt: Date;
    updatedBy: {
        fullName: string;
        id: string;
    } | null;
    visaExpiry: Date | null;
}>;
export declare function restoreEmployee(id: string, changedById: string): Promise<{
    archivedAt: Date | null;
    birthdate: Date;
    createdAt: Date;
    createdBy: {
        fullName: string;
        id: string;
    } | null;
    designation: string;
    eidExpiry: Date | null;
    eidNo: string | null;
    email: string;
    employeeNumber: string;
    fileNo: string | null;
    firstName: string;
    gender: import(".prisma/client").$Enums.Gender;
    id: string;
    laborCardExpiry: Date | null;
    laborCardNo: string | null;
    lastName: string;
    mobileNo: string;
    passportExpiry: Date | null;
    passportNo: string | null;
    status: import(".prisma/client").$Enums.EmployeeStatus;
    uidNo: string | null;
    updatedAt: Date;
    updatedBy: {
        fullName: string;
        id: string;
    } | null;
    visaExpiry: Date | null;
}>;
export declare function deleteEmployee(id: string, changedById: string): Promise<void>;
export declare function getExpiringEmployees(): Promise<{
    eidExpiry: Date | null;
    employeeNumber: string;
    firstName: string;
    id: string;
    laborCardExpiry: Date | null;
    lastName: string;
    passportExpiry: Date | null;
    visaExpiry: Date | null;
}[]>;
//# sourceMappingURL=employee.service.d.ts.map