import { Router } from 'express';
import * as UserController from '../controllers/user.controller';
import isAuthenticated from '../utils/isAuthenticated';

const router = Router();

/**
 * ===============
 * SIGN UP
 * ===============
 */
// POST /signup
router.post('/signup', UserController.createUser);

// GET /signup/duplicate_check
router.get('/signup/duplicate_check', UserController.duplicateUserCheck);

// POST /verify/send
router.post('/verify/send', UserController.emailVerificationInitiate);

// GET /verify
router.get('/verify', UserController.verifyEmail);

/**
 * ===============
 * AUTH MANAGEMENT
 * ===============
 */
// POST /reset-password
router.post('/reset-password', UserController.resetPasswordInitiate);

// GET /reset-password/:token
router.get('/reset-password/:token', UserController.validateResetPasswordToken);

// POST /reset-password/:token
router.post('/reset-password/:token', UserController.updatePassword);

// PUT /account
router.put('/account', isAuthenticated, UserController.updateSettings);

// DELETE /auth/github
router.delete('/auth/github', UserController.unlinkGithub);

// DELETE /auth/google
router.delete('/auth/google', UserController.unlinkGoogle);

/**
 * ===============
 * API KEYS
 * ===============
 */
router.post('/account/api-keys', isAuthenticated, UserController.createApiKey);

router.delete(
  '/account/api-keys/:keyId',
  isAuthenticated,
  UserController.removeApiKey
);

/**
 * ===============
 * USER PREFERENCES
 * ===============
 */
// PUT /preferences
router.put('/preferences', isAuthenticated, UserController.updatePreferences);

// PUT /cookie-consent
router.put(
  '/cookie-consent',
  isAuthenticated,
  UserController.updateCookieConsent
);

export default router;
