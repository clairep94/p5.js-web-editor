/* eslint-disable consistent-return */

import { RequestHandler } from 'express-serve-static-core';
import { User } from '../models/user';
import { CookieConsentOptions, UserPreferences } from '../types';
import mail from '../utils/mail';
import { renderEmailConfirmation, renderResetPassword } from '../views/mail';
import {
  userResponse,
  generateToken,
  saveUser
} from './user.controller/helpers';

export * from './user.controller/apiKey';

// POST /signup
export interface CreateUserRequestBody {
  username: string;
  email: string;
  password: string;
}
export const createUser: RequestHandler<
  {},
  any,
  CreateUserRequestBody
> = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const emailLowerCase = email.toLowerCase();

    const existingUser = await User.findByEmailAndUsername(email, username);
    if (existingUser) {
      const fieldInUse =
        existingUser.email.toLowerCase() === emailLowerCase
          ? 'Email'
          : 'Username';
      return res.status(422).send({ error: `${fieldInUse} is in use` });
    }

    const token = await generateToken();
    const EMAIL_VERIFY_TOKEN_EXPIRY_TIME = Date.now() + 3600000 * 24; // 24 hours

    const user = new User({
      username,
      email: emailLowerCase,
      password,
      verified: User.EmailConfirmation.Sent,
      verifiedToken: token,
      verifiedTokenExpires: EMAIL_VERIFY_TOKEN_EXPIRY_TIME
    });

    await user.save();

    req.logIn(user, async (loginErr) => {
      if (loginErr) {
        console.error(loginErr);
        return res.status(500).json({ error: 'Failed to log in user.' });
      }

      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      const mailOptions = renderEmailConfirmation({
        body: {
          domain: `${protocol}://${req.headers.host}`,
          link: `${protocol}://${req.headers.host}/verify?t=${token}`
        },
        to: req.user!.email
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
};

// GET /signup/duplicate_check
export interface DuplicateUserCheckQuery {
  // eslint-disable-next-line camelcase
  check_type: 'email' | 'string';
  email: string;
  username: string;
}
export const duplicateUserCheck: RequestHandler<
  {},
  any,
  any,
  DuplicateUserCheckQuery
> = async (req, res) => {
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
};

// PUT /preferences
export interface UpdateUserPreferencesRequestBody {
  preferences: Partial<UserPreferences>;
}
export const updatePreferences: RequestHandler<
  {},
  any,
  UpdateUserPreferencesRequestBody
> = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
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
};

// POST /reset-password
export interface ResetPasswordInitiateRequestBody {
  email: string;
}
export const resetPasswordInitiate: RequestHandler<
  {},
  any,
  ResetPasswordInitiateRequestBody
> = async (req, res) => {
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
};

// GET /reset-password/:token
export interface ValidateResetPasswordTokenRequestParams {
  token: string;
}
export const validateResetPasswordToken: RequestHandler<ValidateResetPasswordTokenRequestParams> = async (
  req,
  res
) => {
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
};

// POST /reset-password/:token
export interface UpdatePasswordRequestParams {
  token: string;
}
export interface UpdatePasswordRequestBody {
  password: string;
}
export const updatePassword: RequestHandler<
  UpdatePasswordRequestParams,
  any,
  UpdatePasswordRequestBody
> = async (req, res) => {
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
  req.logIn(user, (loginErr: any) => res.json(userResponse(user)));
  // eventually send email that the password has been reset
};

// POST /verify/send
export const emailVerificationInitiate: RequestHandler = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
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
};

// GET /verify
export interface VerifyEmailRequestQuery {
  t: string;
}
export const verifyEmail: RequestHandler<
  {},
  any,
  any,
  VerifyEmailRequestQuery
> = async (req, res) => {
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
};

// PUT /account
export interface UpdateUserSettingsRequestBody {
  username: string;
  newPassword: string;
  currentPassword: string;
  email: string;
}
export const updateSettings: RequestHandler<
  {},
  any,
  UpdateUserSettingsRequestBody
> = async (req, res) => {
  if (!req.user) {
    res.status(404).json({
      success: false,
      message: 'You must be logged in to complete this action.'
    });
  }

  try {
    const user = await User.findById(req.user?.id);
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
};

// DELETE /auth/github
export const unlinkGithub: RequestHandler = async (req, res) => {
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
};

// DELETE /auth/google
export const unlinkGoogle: RequestHandler = async (req, res) => {
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
};

// PUT /cookie-consent
export interface UpdateCookieConsentRequestBody {
  cookieConsent: CookieConsentOptions;
}
export const updateCookieConsent: RequestHandler<
  {},
  any,
  UpdateCookieConsentRequestBody
> = async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const user = await User.findById(req.user.id).exec();
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.cookieConsent = req.body.cookieConsent;
    await saveUser(res, user);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
