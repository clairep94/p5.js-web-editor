/* @jest-environment node */

import { Request, Response } from 'jest-express';

import * as controller from '../../user.controller';
import { User } from '../../../models/user';
import { mailerService } from '../../../utils/mail';
import {
  renderEmailConfirmation,
  renderResetPassword
} from '../../../views/mail';
import { userResponse, generateToken, saveUser } from '../helpers';

jest.mock('../../../utils/mail', () => ({
  mailerService: {
    send: jest.fn().mockResolvedValue(true)
  }
}));

jest.mock('../../../models/user');
jest.mock('../../../utils/mail');
jest.mock('../../../views/mail');
jest.mock('../helpers');

const mockUserBase = {
  email: 'test@example.com',
  name: 'bob dylan',
  username: 'tester',
  preferences: {
    fontSize: 12,
    lineNumbers: false,
    indentationAmount: 10,
    isTabIndent: false,
    autosave: false,
    linewrap: false,
    lintWarning: false,
    textOutput: false,
    gridOutput: false,
    theme: 'contrast',
    autorefresh: false,
    language: 'en-GB',
    autocloseBracketsQuotes: false,
    autocompleteHinter: false
  },
  apiKeys: [],
  verified: true,
  id: 'abc123',
  totalSize: 42,
  cookieConsent: 'none',
  google: 'user@gmail.com',
  github: 'user123',
  tokens: [{ kind: 'github' }, { kind: 'google' }],
  banned: false
};

describe('user.controller unit tests', () => {
  let req: Request;
  let res: Response;
  let next: () => void;

  beforeEach(() => {
    req = new Request();
    res = new Response();
    next = jest.fn();

    jest.clearAllMocks();

    // default mocks for helpers
    (generateToken as jest.Mock).mockResolvedValue('tok-123');
    (userResponse as jest.Mock).mockImplementation((u) =>
      // return a shallow sanitized shape
      ({
        email: u.email,
        username: u.username,
        id: u.id,
        totalSize: u.totalSize,
        apiKeys: u.apiKeys,
        cookieConsent: u.cookieConsent,
        preferences: u.preferences,
        verified: u.verified,
        google: u.google,
        github: u.github
      })
    );

    // default mail renderer & mailer
    (renderEmailConfirmation as jest.Mock).mockImplementation(
      ({ body, to }) => ({
        to,
        body
      })
    );
    (renderResetPassword as jest.Mock).mockImplementation(({ body, to }) => ({
      to,
      body
    }));
    (mailerService.send as jest.Mock).mockResolvedValue(undefined);

    // default EmailConfirmation helper on User
    ((User as unknown) as any).EmailConfirmation = jest.fn().mockReturnValue({
      Sent: 'sent',
      Resent: 'resent',
      Verified: 'verified'
    });
  });

  /** *************************************************************************
   * createUser
   ************************************************************************** */
  describe('createUser', () => {
    it('responds 422 when email or username already in use', async () => {
      (User as any).findByEmailAndUsername = jest
        .fn()
        .mockResolvedValue({ email: 'test@example.com' });

      req.body = {
        username: 'tester',
        email: 'test@example.com',
        password: 'pw'
      };
      req.headers.host = 'example.test';

      await controller.createUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.send).toHaveBeenCalledWith({ error: expect.any(String) });
    });

    it('creates user, logs in, sends email and responds with sanitized user', async () => {
      (User as any).findByEmailAndUsername = jest.fn().mockResolvedValue(null);

      // new User constructor should return an object with save
      const newUser = {
        ...mockUserBase,
        password: 'pw',
        verified: 'sent',
        verifiedToken: 'tok-123',
        verifiedTokenExpires: expect.any(Number),
        save: jest.fn().mockResolvedValue(undefined)
      };
      // mock User constructor
      (User as any).mockImplementationOnce(() => newUser);

      // req.logIn to call callback with no error
      req.logIn = jest.fn((user, cb) => cb && cb(null));
      req.body = {
        username: 'tester',
        email: 'TEST@EXAMPLE.COM',
        password: 'pw'
      };
      req.headers.host = 'example.test';

      await controller.createUser(req, res, next);

      expect(newUser.save).toHaveBeenCalled();
      expect(mailerService.send).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining(userResponse(newUser))
      );
    });

    it('handles login error by responding 500', async () => {
      (User as any).findByEmailAndUsername = jest.fn().mockResolvedValue(null);
      const newUser = {
        ...mockUserBase,
        password: 'pw',
        verified: 'sent',
        verifiedToken: 'tok-123',
        verifiedTokenExpires: Date.now() + 1000,
        save: jest.fn().mockResolvedValue(undefined)
      };
      (User as any).mockImplementationOnce(() => newUser);

      req.logIn = jest.fn((user, cb) => cb && cb(new Error('login fail')));
      req.body = {
        username: 'tester',
        email: 'test@example.com',
        password: 'pw'
      };
      req.headers.host = 'example.test';

      await controller.createUser(req as any, res as any);

      expect(newUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to log in user.'
      });
    });

    it('handles mailer failure by responding 500', async () => {
      (User as any).findByEmailAndUsername = jest.fn().mockResolvedValue(null);
      const newUser = {
        ...mockUserBase,
        password: 'pw',
        verified: 'sent',
        verifiedToken: 'tok-123',
        verifiedTokenExpires: Date.now() + 1000,
        save: jest.fn().mockResolvedValue(undefined)
      };
      (User as any).mockImplementationOnce(() => newUser);

      req.logIn = jest.fn((user, cb) => cb && cb(null));
      (mailerService.send as jest.Mock).mockRejectedValue(
        new Error('smtp fail')
      );
      req.body = {
        username: 'tester',
        email: 'test@example.com',
        password: 'pw'
      };
      req.headers.host = 'example.test';

      await controller.createUser(req as any, res as any);

      expect(newUser.save).toHaveBeenCalled();
      expect(mailerService.send).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to send verification email.'
      });
    });
  });

  /** *************************************************************************
   * duplicateUserCheck
   ************************************************************************** */
  describe('duplicateUserCheck', () => {
    it('responds 500 when missing value', async () => {
      req.query = { check_type: 'email' }; // but email param missing
      await controller.duplicateUserCheck(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: expect.any(String)
      });
    });

    it('returns exists:true when found', async () => {
      (User as any).findByEmailOrUsername = jest
        .fn()
        .mockResolvedValue({ id: 'u1' });
      req.query = { check_type: 'email', email: 'a@b.com' };

      await controller.duplicateUserCheck(req as any, res as any);

      expect(res.json).toHaveBeenCalledWith({
        exists: true,
        message: 'This email is already taken.',
        type: 'email'
      });
    });

    it('returns exists:false when not found', async () => {
      (User as any).findByEmailOrUsername = jest.fn().mockResolvedValue(null);
      req.query = { check_type: 'username', username: 'someone' };

      await controller.duplicateUserCheck(req as any, res as any);

      expect(res.json).toHaveBeenCalledWith({
        exists: false,
        type: 'username'
      });
    });
  });

  /** *************************************************************************
   * updatePreferences
   ************************************************************************** */
  describe('updatePreferences', () => {
    it('returns 404 if not logged in', async () => {
      req.body = { preferences: { fontSize: 14 } };
      await controller.updatePreferences(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'You must be logged in to complete this action.'
      });
    });

    it('returns 404 if user not found', async () => {
      req.user = { id: 'abc123' } as any;
      (User as any).findById = jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      req.body = { preferences: { fontSize: 14 } };

      await controller.updatePreferences(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('merges preferences, saves and returns preferences', async () => {
      const user = {
        ...mockUserBase,
        preferences: { fontSize: 12, lineNumbers: false },
        save: jest.fn().mockResolvedValue(undefined)
      };
      (User as any).findById = jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(user) });

      req.user = { id: 'abc123' } as any;
      req.body = { preferences: { fontSize: 16 } };

      await controller.updatePreferences(req as any, res as any);

      expect(user.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ fontSize: 16 })
      );
    });
  });

  /** *************************************************************************
   * resetPasswordInitiate
   ************************************************************************** */
  describe('resetPasswordInitiate', () => {
    it('responds success true if user not found (no leak)', async () => {
      (generateToken as jest.Mock).mockResolvedValue('tok-123');
      (User as any).findByEmail = jest.fn().mockResolvedValue(null);
      req.body = { email: 'no-such@example.com' };
      req.headers.host = 'example.test';

      await controller.resetPasswordInitiate(req as any, res as any);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: expect.any(String)
      });
    });

    it('saves token, sends email and responds success true when user found', async () => {
      (generateToken as jest.Mock).mockResolvedValue('tok-123');
      const user = {
        ...mockUserBase,
        save: jest.fn().mockResolvedValue(undefined)
      };
      (User as any).findByEmail = jest.fn().mockResolvedValue(user);
      req.body = { email: 'test@example.com' };
      req.headers.host = 'example.test';

      await controller.resetPasswordInitiate(req as any, res as any);

      expect(user.save).toHaveBeenCalled();
      expect(mailerService.send).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: expect.any(String)
      });
    });

    it('returns success false on exception (mailer error)', async () => {
      (generateToken as jest.Mock).mockResolvedValue('tok-123');
      const user = {
        ...mockUserBase,
        save: jest.fn().mockResolvedValue(undefined)
      };
      (User as any).findByEmail = jest.fn().mockResolvedValue(user);
      (mailerService.send as jest.Mock).mockRejectedValue(
        new Error('mailfail')
      );
      req.body = { email: 'test@example.com' };
      req.headers.host = 'example.test';

      await controller.resetPasswordInitiate(req as any, res as any);

      expect(user.save).toHaveBeenCalled();
      expect(mailerService.send).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: false });
    });
  });

  /** *************************************************************************
   * validateResetPasswordToken
   ************************************************************************** */
  describe('validateResetPasswordToken', () => {
    it('returns 401 when token invalid or expired', async () => {
      (User as any).findOne = jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      req.params = { token: 'bad' };

      await controller.validateResetPasswordToken(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Password reset token is invalid or has expired.'
      });
    });

    it('returns success true when token valid', async () => {
      const user = { id: 'u1' };
      (User as any).findOne = jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(user) });
      req.params = { token: 'good' };

      await controller.validateResetPasswordToken(req as any, res as any);

      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });

  /** *************************************************************************
   * emailVerificationInitiate
   ************************************************************************** */
  describe('emailVerificationInitiate', () => {
    it('returns 404 if not logged in', async () => {
      await controller.emailVerificationInitiate(req as any, res as any);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'You must be logged in to complete this action.'
      });
    });

    it('returns 404 if user not found', async () => {
      req.user = { id: 'abc123' } as any;
      (User as any).findById = jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await controller.emailVerificationInitiate(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('returns 409 if already verified', async () => {
      req.user = { id: 'abc123' } as any;
      const user = { ...mockUserBase, verified: 'verified' };
      (User as any).findById = jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(user) });

      await controller.emailVerificationInitiate(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Email already verified'
      });
    });

    it('sends mail, updates user, saves and responds with sanitized user', async () => {
      req.user = { id: 'abc123', email: 'test@example.com' } as any;
      const user = {
        ...mockUserBase,
        verified: 'sent',
        save: jest.fn().mockResolvedValue(undefined)
      };
      (User as any).findById = jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(user) });
      (mailerService.send as jest.Mock).mockResolvedValue(undefined);

      req.headers.host = 'example.test';

      await controller.emailVerificationInitiate(req as any, res as any);

      expect(mailerService.send).toHaveBeenCalled();
      expect(user.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining(userResponse(req.user))
      );
    });

    it('handles mail send error with 500', async () => {
      req.user = { id: 'abc123', email: 'test@example.com' } as any;
      const user = {
        ...mockUserBase,
        verified: 'sent',
        save: jest.fn().mockResolvedValue(undefined)
      };
      (User as any).findById = jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(user) });
      (mailerService.send as jest.Mock).mockRejectedValue(new Error('fail'));

      await controller.emailVerificationInitiate(req as any, res as any);

      expect(mailerService.send).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: 'Error sending mail' });
    });
  });

  /** *************************************************************************
   * verifyEmail
   ************************************************************************** */
  describe('verifyEmail', () => {
    it('returns 401 when token invalid', async () => {
      (User as any).findOne = jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      req.query = { t: 'bad' };

      await controller.verifyEmail(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token is invalid or has expired.'
      });
    });

    it('verifies user, clears tokens and responds success', async () => {
      const user = { save: jest.fn().mockResolvedValue(undefined) };
      (User as any).findOne = jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(user) });
      req.query = { t: 'good' };

      await controller.verifyEmail(req as any, res as any);

      expect(user.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });

  /** *************************************************************************
   * updatePassword
   ************************************************************************** */
  describe('updatePassword', () => {
    it('returns 401 when token invalid', async () => {
      (User as any).findOne = jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      req.params = { token: 'bad' };

      await controller.updatePassword(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Password reset token is invalid or has expired.'
      });
    });

    it('updates password, saves and logs in user then responds with sanitized user', async () => {
      const user = {
        ...mockUserBase,
        save: jest.fn().mockResolvedValue(undefined)
      };
      (User as any).findOne = jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(user) });

      // set req.logIn and req.user for response
      req.logIn = jest.fn((u, cb) => cb && cb(null));
      req.params = { token: 'good' };
      req.body = { password: 'newpass' };
      // req.user in this flow used by userResponse after logIn; simulate
      (req as any).user = {
        email: 'test@example.com',
        username: 'tester',
        id: 'abc123'
      };

      await controller.updatePassword(req as any, res as any);

      expect(user.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining(userResponse(req.user))
      );
    });
  });

  /** *************************************************************************
   * updateSettings
   ************************************************************************** */
  describe('updateSettings', () => {
    it('returns 404 if not logged in', async () => {
      await controller.updateSettings(req as any, res as any);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'You must be logged in to complete this action.'
      });
    });

    it('returns 404 if user not found', async () => {
      req.user = { id: 'abc123' } as any;
      (User as any).findById = jest.fn().mockResolvedValue(null);
      await controller.updateSettings(req as any, res as any);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('updates username and saves via saveUser when email unchanged', async () => {
      const user = {
        ...mockUserBase,
        password: 'old',
        save: jest.fn().mockResolvedValue(undefined)
      };
      (User as any).findById = jest.fn().mockResolvedValue(user);
      req.user = { id: 'abc123' } as any;
      req.body = { username: 'newname', email: user.email };

      (saveUser as jest.Mock).mockResolvedValue(undefined);

      await controller.updateSettings(req as any, res as any);

      expect(user.username).toBe('newname');
      expect(saveUser).toHaveBeenCalledWith(res, user);
    });

    it('changes email, generates token, saves, sends mail', async () => {
      const user = {
        ...mockUserBase,
        save: jest.fn().mockResolvedValue(undefined)
      };
      (User as any).findById = jest.fn().mockResolvedValue(user);
      req.user = { id: 'abc123' } as any;
      req.body = {
        username: user.username,
        email: 'new@example.com',
        newPassword: '',
        currentPassword: ''
      };
      req.headers.host = 'example.test';

      (generateToken as jest.Mock).mockResolvedValue('tok-123');
      (saveUser as jest.Mock).mockResolvedValue(undefined);

      await controller.updateSettings(req as any, res as any);

      expect(user.email).toBe('new@example.com');
      expect(user.verified).toBe('sent');
      expect(generateToken).toHaveBeenCalled();
      expect(saveUser).toHaveBeenCalledWith(res, user);
      expect(mailerService.send).toHaveBeenCalled();
    });

    it('when newPassword and user.password undefined -> set password and saveUser called', async () => {
      const user = {
        ...mockUserBase,
        password: undefined,
        save: jest.fn().mockResolvedValue(undefined)
      };
      (User as any).findById = jest.fn().mockResolvedValue(user);
      req.user = { id: 'abc123' } as any;
      req.body = { username: 'u', newPassword: 'new', currentPassword: '' };

      (saveUser as jest.Mock).mockResolvedValue(undefined);

      await controller.updateSettings(req as any, res as any);

      expect(user.password).toBe('new');
      expect(saveUser).toHaveBeenCalledWith(res, user);
    });

    it('returns 401 if newPassword provided but currentPassword missing', async () => {
      const user = { ...mockUserBase, password: 'old' };
      (User as any).findById = jest.fn().mockResolvedValue(user);
      req.user = { id: 'abc123' } as any;
      req.body = { username: 'u', newPassword: 'new', currentPassword: '' };

      await controller.updateSettings(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Current password is not provided.'
      });
    });

    it('returns 401 if currentPassword invalid', async () => {
      const user: any = {
        ...mockUserBase,
        password: 'old',
        comparePassword: jest.fn().mockResolvedValue(false)
      };
      (User as any).findById = jest.fn().mockResolvedValue(user);
      req.user = { id: 'abc123' } as any;
      req.body = {
        username: 'u',
        newPassword: 'new',
        currentPassword: 'wrong'
      };

      await controller.updateSettings(req as any, res as any);

      expect(user.comparePassword).toHaveBeenCalledWith('wrong');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Current password is invalid.'
      });
    });

    it('changes password when currentPassword valid and calls saveUser', async () => {
      const user: any = {
        ...mockUserBase,
        password: 'old',
        comparePassword: jest.fn().mockResolvedValue(true)
      };
      (User as any).findById = jest.fn().mockResolvedValue(user);
      req.user = { id: 'abc123' } as any;
      req.body = { username: 'u', newPassword: 'new', currentPassword: 'old' };

      (saveUser as jest.Mock).mockResolvedValue(undefined);

      await controller.updateSettings(req as any, res as any);

      expect(user.comparePassword).toHaveBeenCalledWith('old');
      expect(user.password).toBe('new');
      expect(saveUser).toHaveBeenCalledWith(res, user);
    });
  });

  /** *************************************************************************
   * unlinkGithub / unlinkGoogle
   ************************************************************************** */
  describe('unlinkGithub & unlinkGoogle', () => {
    it('returns 404 when not logged in for unlinkGithub', async () => {
      await controller.unlinkGithub(req as any, res as any);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'You must be logged in to complete this action.'
      });
    });

    it('unlinks github when logged in', async () => {
      const user: any = {
        ...mockUserBase,
        tokens: [{ kind: 'github' }, { kind: 'other' }],
        save: jest.fn().mockResolvedValue(undefined)
      };
      (saveUser as jest.Mock).mockResolvedValue(undefined);
      req.user = user as any;
      (req as any).user = user;

      await controller.unlinkGithub(req as any, res as any);

      expect(user.github).toBeUndefined();
      expect(saveUser).toHaveBeenCalledWith(res, user);
    });

    it('returns 404 when not logged in for unlinkGoogle', async () => {
      await controller.unlinkGoogle(req as any, res as any);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'You must be logged in to complete this action.'
      });
    });

    it('unlinks google when logged in', async () => {
      const user: any = {
        ...mockUserBase,
        tokens: [{ kind: 'google' }, { kind: 'other' }],
        save: jest.fn().mockResolvedValue(undefined)
      };
      (saveUser as jest.Mock).mockResolvedValue(undefined);
      req.user = user as any;
      (req as any).user = user;

      await controller.unlinkGoogle(req as any, res as any);

      expect(user.google).toBeUndefined();
      expect(saveUser).toHaveBeenCalledWith(res, user);
    });
  });

  /** *************************************************************************
   * updateCookieConsent
   ************************************************************************** */
  describe('updateCookieConsent', () => {
    it('returns 404 if user not found', async () => {
      req.user = { id: 'abc123' } as any;
      (User as any).findById = jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      req.body = { cookieConsent: 'none' };

      await controller.updateCookieConsent(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('sets cookieConsent and calls saveUser', async () => {
      const user: any = {
        ...mockUserBase,
        save: jest.fn().mockResolvedValue(undefined)
      };
      (User as any).findById = jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(user) });
      (saveUser as jest.Mock).mockResolvedValue(undefined);
      req.user = { id: 'abc123' } as any;
      req.body = { cookieConsent: 'none' };

      await controller.updateCookieConsent(req as any, res as any);

      expect(user.cookieConsent).toBe('none');
      expect(saveUser).toHaveBeenCalledWith(res, user);
    });
  });
});
