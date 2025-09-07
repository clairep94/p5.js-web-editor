/* eslint-disable consistent-return */
import { RequestHandler } from 'express';
import { User } from '../../models/user';
import { saveUser, generateToken, userResponse } from './helpers';
import mail from '../../utils/mail';
import { renderResetPassword, renderEmailConfirmation } from '../../views/mail';

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
