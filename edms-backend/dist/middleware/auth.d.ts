import { Request, Response, NextFunction } from 'express';
export declare function authenticate(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function requireSuperAdmin(req: Request, res: Response, next: NextFunction): void;
import { ZodSchema } from 'zod';
export declare function validate(schema: ZodSchema, source?: 'body' | 'query'): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map