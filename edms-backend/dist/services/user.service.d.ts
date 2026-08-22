import { CreateUserInput, UpdateUserInput } from '../lib/schemas';
export declare function listUsers(): Promise<{
    createdAt: Date;
    email: string;
    fullName: string;
    id: string;
    isActive: boolean;
    lastLoginAt: Date | null;
    role: import(".prisma/client").$Enums.Role;
}[]>;
export declare function getUser(id: string): Promise<{
    createdAt: Date;
    email: string;
    fullName: string;
    id: string;
    isActive: boolean;
    lastLoginAt: Date | null;
    role: import(".prisma/client").$Enums.Role;
}>;
export declare function createUser(data: CreateUserInput, createdById: string): Promise<{
    createdAt: Date;
    email: string;
    fullName: string;
    id: string;
    isActive: boolean;
    role: import(".prisma/client").$Enums.Role;
}>;
export declare function updateUser(id: string, data: UpdateUserInput, updatedById: string): Promise<{
    createdAt: Date;
    email: string;
    fullName: string;
    id: string;
    isActive: boolean;
    lastLoginAt: Date | null;
    role: import(".prisma/client").$Enums.Role;
}>;
export declare function deactivateUser(id: string, deactivatedById: string): Promise<{
    email: string;
    fullName: string;
    id: string;
    isActive: boolean;
    role: import(".prisma/client").$Enums.Role;
}>;
//# sourceMappingURL=user.service.d.ts.map