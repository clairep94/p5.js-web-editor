import { UserDocument } from './user';

declare global {
  namespace Express {
    interface User extends UserDocument {}
    interface Request {
      user?: UserDocument;
      logIn: (user: UserDocument, callback: (err?: any) => void) => void;
      logOut: (callback: (err?: any) => void) => void;
      isAuthenticated: () => boolean;
    }
  }
}
