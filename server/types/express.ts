import { Request } from 'express';
import { PublicUser, User } from './user';

// workaround for express.d.ts not working as expected
/** Authenticated express request for routes that require authentication, which attaches user: {id:string} */
export interface AuthenticatedRequest extends Request {
  user: User;
}

/** Simple error object for express requests */
export interface Error {
  error: string | unknown;
}
