import { Request } from 'express';

export interface UserPayload {
  userId: string;
  email: string;
  role: string;
}

export interface UserRequest extends Request {
  user: UserPayload;
}
