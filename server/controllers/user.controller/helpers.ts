import crypto from 'crypto';
import { Response } from 'express';
import { UserDocument, PublicUserDocument } from '../../types';
import { User } from '../../models/user';

export function userResponse(
  user: UserDocument | PublicUserDocument
): PublicUserDocument {
  return {
    email: user.email,
    username: user.username,
    preferences: user.preferences,
    apiKeys: user.apiKeys,
    verified: user.verified,
    id: '_id' in user ? String(user._id) : user.id,
    totalSize: user.totalSize,
    github: user.github,
    google: user.google,
    cookieConsent: user.cookieConsent
  };
}

/**
 * Create a new verification token.
 * Note: can be done synchronously - https://nodejs.org/api/crypto.html#cryptorandombytessize-callback
 * @return Promise<string>
 */
export async function generateToken(): Promise<string | undefined> {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(20, (err, buf) => {
      if (err) {
        reject(err);
      } else {
        const token = buf.toString('hex');
        resolve(token);
      }
    });
  });
}

/**
 * @param {string} username
 * @return {Promise<boolean>}
 */
export async function userExists(username: string) {
  const user = await User.findByUsername(username);
  return user != null;
}

/**
 * Updates the user object and sets the response.
 * Response is the user or a 500 error.
 * @param res
 * @param user
 */
export async function saveUser(res: Response, user: UserDocument) {
  try {
    await user.save();
    res.json(userResponse(user));
  } catch (error) {
    res.status(500).json({ error });
  }
}
