import { Request } from 'express';

// workaround for express.d.ts not working as expected
/** Authenticated express request for routes that require authentication, which attaches user: {id:string} */
export interface AuthenticatedRequest extends Request {
  user: { id: string };
}

/** Simple error object for express requests */
export interface Error {
  error: string | unknown;
}
