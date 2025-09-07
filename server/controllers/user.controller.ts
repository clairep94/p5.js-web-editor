import crypto from 'crypto';
import { Request, Response } from 'express';
import { User } from '../models/user';
import {
  CookieConsentOptions,
  UserDocument,
  UserPreferences,
  PublicUserDocument
} from '../types';
import mail from '../utils/mail';
import { renderEmailConfirmation, renderResetPassword } from '../views/mail';

export * from './user.controller/apiKey';

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
async function generateToken(): Promise<string | undefined> {
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

// ===== CREATE USER =====
export interface CreateUserRequestBody {
  username: string;
  email: string;
  password: string;
}
interface CreateUserRequest extends Request<{}, {}, CreateUserRequestBody> {
  user: PublicUserDocument;
  logIn: (user: any, callback: (err?: any) => void) => void;
}
export async function createUser(req: CreateUserRequest, res: Response) {
  try {
    const { username, email, password } = req.body;
    const emailLowerCase = email.toLowerCase();
    const existingUser = await User.findByEmailAndUsername(email, username);
    if (existingUser) {
      const fieldInUse =
        existingUser.email.toLowerCase() === emailLowerCase
          ? 'Email'
          : 'Username';
      res.status(422).send({ error: `${fieldInUse} is in use` });
      return;
    }

    const EMAIL_VERIFY_TOKEN_EXPIRY_TIME = Date.now() + 3600000 * 24; // 24 hours
    const token = await generateToken();
    const user = new User({
      username,
      email: emailLowerCase,
      password,
      verified: User.EmailConfirmation.Sent,
      verifiedToken: token,
      verifiedTokenExpires: EMAIL_VERIFY_TOKEN_EXPIRY_TIME
    });

    await user.save();

    req.logIn(user, async (loginErr: any) => {
      if (loginErr) {
        console.error(loginErr);
        res.status(500).json({ error: 'Failed to log in user.' });
        return;
      }

      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      const mailOptions = renderEmailConfirmation({
        body: {
          domain: `${protocol}://${req.headers.host}`,
          link: `${protocol}://${req.headers.host}/verify?t=${token}`
        },
        to: req.user.email
      });

      try {
        await mail.send(mailOptions);
        res.json(userResponse(user));
      } catch (mailErr) {
        console.error(mailErr);
        res.status(500).json({ error: 'Failed to send verification email.' });
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err });
  }
}

// ===== DUPLICATE USER CHECK =====
export interface DuplicateUserCheckQuery {
  // eslint-disable-next-line camelcase
  check_type: 'email' | 'string';
  email: string;
  username: string;
}
interface DuplicateUserCheckRequest
  extends Request<{}, {}, {}, DuplicateUserCheckQuery> {
  user: PublicUserDocument;
  logIn: (user: any, callback: (err?: any) => void) => void;
}

export async function duplicateUserCheck(
  req: DuplicateUserCheckRequest,
  res: Response
) {
  const checkType = req.query.check_type;
  const value = req.query[checkType as 'email' | 'username'];
  const options = {
    caseInsensitive: true,
    valueType: checkType as 'email' | 'username'
  };
  const user = await User.findByEmailOrUsername(value, options);
  if (user) {
    return res.json({
      exists: true,
      message: `This ${checkType} is already taken.`,
      type: checkType
    });
  }
  return res.json({
    exists: false,
    type: checkType
  });
}

// ===== UPDATE USER PREFERENCES =====
export interface UpdateUserPreferencesRequestBody {
  preferences: Partial<UserPreferences>;
}
interface UpdateUserPreferencesRequest
  extends Request<{}, {}, UpdateUserPreferencesRequestBody> {
  user: PublicUserDocument;
}
export async function updatePreferences(
  req: UpdateUserPreferencesRequest,
  res: Response
) {
  try {
    const user = await User.findById(req.user.id).exec();
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    // Shallow merge the new preferences with the existing.
    user.preferences = { ...user.preferences, ...req.body.preferences };
    await user.save();
    res.json(user.preferences);
  } catch (err) {
    res.status(500).json({ error: err });
  }
}

// ===== RESET PASSWORD INITIATE =====
export interface ResetPasswordInitiateRequestBody {
  email: string;
}
interface ResetPasswordInitiateRequest
  extends Request<{}, {}, ResetPasswordInitiateRequestBody> {
  user: PublicUserDocument;
}
export async function resetPasswordInitiate(
  req: ResetPasswordInitiateRequest,
  res: Response
) {
  try {
    const token = await generateToken();
    const user = await User.findByEmail(req.body.email);
    if (!user) {
      res.json({
        success: true,
        message:
          'If the email is registered with the editor, an email has been sent.'
      });
      return;
    }
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const mailOptions = renderResetPassword({
      body: {
        domain: `${protocol}://${req.headers.host}`,
        link: `${protocol}://${req.headers.host}/reset-password/${token}`
      },
      to: user.email
    });

    await mail.send(mailOptions);
    res.json({
      success: true,
      message:
        'If the email is registered with the editor, an email has been sent.'
    });
  } catch (err) {
    console.log(err);
    res.json({ success: false });
  }
}

// ===== RESET PASSWORD INITIATE =====
export interface ValidateResetPasswordTokenRequestParams {
  token: string;
}
interface ValidateResetPasswordTokenRequest
  extends Request<ValidateResetPasswordTokenRequestParams> {
  user: PublicUserDocument;
}
export async function validateResetPasswordToken(
  req: ValidateResetPasswordTokenRequest,
  res: Response
) {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  }).exec();
  if (!user) {
    res.status(401).json({
      success: false,
      message: 'Password reset token is invalid or has expired.'
    });
    return;
  }
  res.json({ success: true });
}

// ===== EMAIL VERIFICATION INITIATE =====
interface EmailVerificationInitiateRequest extends Request {
  user: UserDocument;
}
export async function emailVerificationInitiate(
  req: EmailVerificationInitiateRequest,
  res: Response
) {
  try {
    const token = await generateToken();
    const user = await User.findById(req.user.id).exec();
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    if (user.verified === User.EmailConfirmation.Verified) {
      res.status(409).json({ error: 'Email already verified' });
      return;
    }
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const mailOptions = renderEmailConfirmation({
      body: {
        domain: `${protocol}://${req.headers.host}`,
        link: `${protocol}://${req.headers.host}/verify?t=${token}`
      },
      to: user.email
    });
    try {
      await mail.send(mailOptions);
    } catch (mailErr) {
      res.status(500).send({ error: 'Error sending mail' });
      return;
    }
    const EMAIL_VERIFY_TOKEN_EXPIRY_TIME = Date.now() + 3600000 * 24; // 24 hours
    user.verified = User.EmailConfirmation.Resent;
    user.verifiedToken = token;
    user.verifiedTokenExpires = EMAIL_VERIFY_TOKEN_EXPIRY_TIME; // 24 hours
    await user.save();

    res.json(userResponse(req.user));
  } catch (err) {
    res.status(500).json({ error: err });
  }
}

// ===== VERIFY EMAIL =====
export interface VerifyEmailRequestQuery {
  t: string;
}
interface VerifyEmailRequest
  extends Request<{}, {}, {}, VerifyEmailRequestQuery> {
  user: PublicUserDocument;
  logIn: (user: any, callback: (err?: any) => void) => void;
}
export async function verifyEmail(req: VerifyEmailRequest, res: Response) {
  const token = req.query.t;
  const user = await User.findOne({
    verifiedToken: token,
    verifiedTokenExpires: { $gt: new Date() }
  }).exec();
  if (!user) {
    res.status(401).json({
      success: false,
      message: 'Token is invalid or has expired.'
    });
    return;
  }
  user.verified = User.EmailConfirmation.Verified;
  user.verifiedToken = null;
  user.verifiedTokenExpires = null;
  await user.save();
  res.json({ success: true });
}

// ===== UPDATE PASSWORD =====
export interface UpdatePasswordRequestParams {
  token: string;
}
export interface UpdatePasswordRequestBody {
  password: string;
}
interface UpdatePasswordRequest
  extends Request<UpdatePasswordRequestParams, {}, UpdatePasswordRequestBody> {
  user: PublicUserDocument;
  logIn: (user: any, callback: (err?: any) => void) => void;
}
export async function updatePassword(
  req: UpdatePasswordRequest,
  res: Response
) {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  }).exec();
  if (!user) {
    res.status(401).json({
      success: false,
      message: 'Password reset token is invalid or has expired.'
    });
    return;
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();
  req.logIn(user, (loginErr: any) => res.json(userResponse(req.user)));
  // eventually send email that the password has been reset
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

// ===== UPDATE USER PREFERENCES ======
export interface UpdateUserSettingsRequestBody {
  username: string;
  newPassword: string;
  currentPassword: string;
  email: string;
}
interface UpdateUserSettingsRequest
  extends Request<{}, {}, UpdateUserSettingsRequestBody> {
  user: PublicUserDocument;
}
export async function updateSettings(
  req: UpdateUserSettingsRequest,
  res: Response
) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    user.username = req.body.username;

    if (req.body.newPassword) {
      if (user.password === undefined) {
        user.password = req.body.newPassword;
        saveUser(res, user);
      }
      if (!req.body.currentPassword) {
        res.status(401).json({ error: 'Current password is not provided.' });
        return;
      }
    }
    if (req.body.currentPassword) {
      const isMatch = await user.comparePassword(req.body.currentPassword);
      if (!isMatch) {
        res.status(401).json({ error: 'Current password is invalid.' });
        return;
      }
      user.password = req.body.newPassword;
      await saveUser(res, user);
    } else if (user.email !== req.body.email) {
      const EMAIL_VERIFY_TOKEN_EXPIRY_TIME = Date.now() + 3600000 * 24; // 24 hours
      user.verified = User.EmailConfirmation.Sent;

      user.email = req.body.email;

      const token = await generateToken();
      user.verifiedToken = token;
      user.verifiedTokenExpires = EMAIL_VERIFY_TOKEN_EXPIRY_TIME;

      await saveUser(res, user);

      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      const mailOptions = renderEmailConfirmation({
        body: {
          domain: `${protocol}://${req.headers.host}`,
          link: `${protocol}://${req.headers.host}/verify?t=${token}`
        },
        to: user.email
      });

      await mail.send(mailOptions);
    } else {
      await saveUser(res, user);
    }
  } catch (err) {
    res.status(500).json({ error: err });
  }
}

// ===== UNLINK GITHUB ======
interface UnlinkGithubRequest extends Request {
  user: UserDocument;
}
export async function unlinkGithub(req: UnlinkGithubRequest, res: Response) {
  if (req.user) {
    req.user.github = undefined;
    req.user.tokens = req.user.tokens.filter(
      (token) => token.kind !== 'github'
    );
    await saveUser(res, req.user);
    return;
  }
  res.status(404).json({
    success: false,
    message: 'You must be logged in to complete this action.'
  });
}

// ===== UNLINK GITHUB ======
interface UnlinkGoogleRequest extends Request {
  user: UserDocument;
}
export async function unlinkGoogle(req: UnlinkGoogleRequest, res: Response) {
  if (req.user) {
    req.user.google = undefined;
    req.user.tokens = req.user.tokens.filter(
      (token: { kind: string }) => token.kind !== 'google'
    );
    await saveUser(res, req.user);
    return;
  }
  res.status(404).json({
    success: false,
    message: 'You must be logged in to complete this action.'
  });
}

// ===== UPDATE COOKIE CONSENT ======
export interface UpdateCookieConsentRequestBody {
  cookieConsent: CookieConsentOptions;
}
interface UpdateCookieConsentRequest
  extends Request<{}, {}, UpdateCookieConsentRequestBody> {
  user: UserDocument;
}
export async function updateCookieConsent(
  req: UpdateCookieConsentRequest,
  res: Response
) {
  try {
    const user = await User.findById(req.user.id).exec();
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const { cookieConsent } = req.body;
    user.cookieConsent = cookieConsent;
    await saveUser(res, user);
  } catch (err) {
    res.status(500).json({ error: err });
  }
}
