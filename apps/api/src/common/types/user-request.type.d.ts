import { Request } from 'express';
export interface UserPayload {
    userId: string;
    email: string;
    role: string;
}
export interface UserRequest extends Request {
    user: UserPayload;
}
//# sourceMappingURL=user-request.type.d.ts.map