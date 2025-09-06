import { UserPreferences, CookieConsent } from './userPreferences';
import { ApiKeyDocument } from '../server/models/user';

export interface User {
  name: string;
  username: string;
  password?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  verified?: string;
  verifiedToken?: string;
  verifiedTokenExpires?: Date;
  github?: string;
  google?: string;
  email?: string;
  tokens?: any[];
  apiKeys: ApiKeyDocument[];
  preferences: UserPreferences;
  totalSize: number;
  cookieConsent: CookieConsent;
  banned: boolean;
  lastLoginTimestamp?: Date;
}
