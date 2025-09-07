/* eslint-disable consistent-return */
import { RequestHandler } from 'express';
import { CookieConsentOptions, UserPreferences } from '../../types';
import { User } from '../../models/user';
import { saveUser } from './helpers';

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
