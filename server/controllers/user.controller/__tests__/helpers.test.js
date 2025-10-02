/* @jest-environment node */

import { Request, Response } from 'jest-express';
import crypto from 'crypto';

import { userResponse, generateToken, saveUser, userExists } from '../index';
import { User } from '../../../models/user';
import { CookieConsentOptions, AppThemeOptions } from '../../../types';

jest.mock('../../../models/user');

const mockFullUser = {
  email: 'test@example.com',
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
    theme: AppThemeOptions.CONTRAST,
    autorefresh: false,
    language: 'en-GB',
    autocloseBracketsQuotes: false,
    autocompleteHinter: false
  },
  apiKeys: [],
  verified: true,
  id: 'abc123',
  totalSize: 42,
  cookieConsent: CookieConsentOptions.NONE,

  // to be removed:
  password: 'abweorij',
  resetPasswordToken: '1i14ij23',
  banned: false
};

describe('user.helpers', () => {
  let request;
  let response;

  beforeEach(() => {
    request = new Request();
    response = new Response();
  });

  afterEach(() => {
    request.resetMocked();
    response.resetMocked();
    jest.clearAllMocks();
  });

  describe('userResponse', () => {
    it('returns a sanitized PublicUser object', () => {
      const result = userResponse(mockFullUser);

      // eslint-disable-next-line no-unused-vars
      const { password, resetPasswordToken, banned, ...sanitised } = result;

      expect(result).toEqual(sanitised);
    });
    it('gracefully handles objects with some, but not all properties of PublicUser', () => {
      const fakeUser = {
        email: 'test@example.com',
        username: 'tester',
        id: 'abc123',
        totalSize: 42,

        // to be removed:
        password: 'abweorij',
        resetPasswordToken: '1i14ij23',
        banned: false
      };

      const result = userResponse(fakeUser);

      // eslint-disable-next-line no-unused-vars
      const { password, resetPasswordToken, banned, ...sanitised } = result;

      expect(result).toEqual(sanitised);
    });
  });

  describe('generateToken', () => {
    it('generates a random hex string of length 40', async () => {
      const token = await generateToken();
      expect(typeof token).toBe('string');
      expect(token).toMatch(/^[a-f0-9]+$/);
      expect(token).toHaveLength(40);
    });

    it('rejects if crypto.randomBytes errors', async () => {
      const spy = jest
        .spyOn(crypto, 'randomBytes')
        .mockImplementationOnce((_size, cb) => {
          cb(new Error('fail'), Buffer.alloc(0));
          return {};
        });

      await expect(generateToken()).rejects.toThrow('fail');

      spy.mockRestore();
    });
  });

  describe('saveUser', () => {
    it('saves user and responds with sanitized user', async () => {
      const user = {
        ...mockFullUser,
        save: jest.fn().mockResolvedValue(undefined)
      };

      await saveUser(response, user);

      expect(user.save).toHaveBeenCalled();
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'x@y.com',
          username: 'user1'
        })
      );
    });

    it('responds with 500 if save fails', async () => {
      const user = {
        ...mockFullUser,
        save: jest.fn().mockRejectedValue(new Error('db error'))
      };

      await saveUser(response, user);

      expect(response.status).toHaveBeenCalledWith(500);
      expect(response.json).toHaveBeenCalledWith({ error: expect.any(Error) });
    });
  });

  describe('userExists', () => {
    it('returns true if user is found', async () => {
      User.findByUsername = jest.fn().mockResolvedValue({ id: '123' });
      const result = await userExists('someone');
      expect(result).toBe(true);
    });

    it('returns false if user not found', async () => {
      User.findByUsername = jest.fn().mockResolvedValue(null);
      const result = await userExists('nobody');
      expect(result).toBe(false);
    });
  });
});
