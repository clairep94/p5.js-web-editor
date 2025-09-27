import { Request } from 'express';
import { User } from './user';

// workaround for express.d.ts not working as expected
/** Authenticated express request for routes that require authentication, which attaches user: {id:string} */
export interface AuthenticatedRequest extends Request {
  user: User;
}

/** Simple error object for express requests */
export interface Error {
  error: string | unknown;
}

/** Simple response object for express requests with success status and optional message */
export interface ResponseWithMessageAndSuccess {
  success: boolean;
  message?: string;
}
