import { Model } from 'mongoose';
import { UserPreferences, CookieConsentOptions } from './userPreferences';
import { EmailConfirmationStates } from './email';
import { ApiKeyDocument } from './apiKey';
import { DocumentWithTimestampAndVirtualId } from './mongoose';

export interface UserInterface {
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
  cookieConsent: CookieConsentOptions;
  banned: boolean;
  lastLoginTimestamp?: Date;
}

export interface UserDocument
  extends UserInterface,
    DocumentWithTimestampAndVirtualId {}

export interface UserModel extends Model<UserDocument> {
  findByEmail(email: string | string[]): Promise<UserDocument | null>;
  findAllByEmails(emails: string[]): Promise<UserDocument[] | null>;
  findByUsername(
    username: string,
    options?: { caseInsensitive: boolean }
  ): Promise<UserDocument | null>;
  findByEmailOrUsername(
    value: string,
    options?: { caseInsensitive: boolean; valueType: 'email' | 'username' }
  ): Promise<UserDocument | null>;
  findByEmailAndUsername(
    email: string,
    username: string
  ): Promise<UserDocument | null>;
  EmailConfirmation: typeof EmailConfirmationStates;
}
