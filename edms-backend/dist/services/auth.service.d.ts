import { JwtPayload } from '../types';
export declare function signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string;
export declare function signRefreshToken(userId: string): string;
export declare function loginUser(email: string, password: string): Promise<{
    accessToken: string;
    refreshToken: string;
    mustChangePw: boolean;
    user: {
        id: string;
        email: string;
        fullName: string;
        role: import(".prisma/client").$Enums.Role;
    };
}>;
export declare function logoutUser(token: string): Promise<void>;
export declare function refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
}>;
export declare function hashPassword(password: string): Promise<string>;
export declare function verifyPassword(plain: string, hash: string): Promise<boolean>;
export declare function purgeExpiredTokens(): Promise<void>;
//# sourceMappingURL=auth.service.d.ts.map