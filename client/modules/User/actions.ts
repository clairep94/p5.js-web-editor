import { FORM_ERROR } from 'final-form';
import { AnyAction, Dispatch } from 'redux';
import * as ActionTypes from '../../constants';
import browserHistory from '../../browserHistory';
import { apiClient } from '../../utils/apiClient';
import { showErrorModal, justOpenedProject } from '../IDE/actions/ide';
import { setLanguage } from '../IDE/actions/preferences';
import { showToast, setToastText } from '../IDE/actions/toast';
import type {
  CookieConsentOptions,
  CreateUserRequestBody,
  Error,
  PublicUser,
  ResetOrUpdatePasswordRequestParams,
  ResetPasswordInitiateRequestBody,
  SanitisedApiKey,
  UpdatePasswordRequestBody,
  UpdateSettingsRequestBody,
  UserPreferences
} from '../../../common/types';
import { RootState } from '../../reducers';
import type { GetRootState } from '../IDE/actions/preferences.types';

export function authError(error: Error) {
  return {
    type: ActionTypes.AUTH_ERROR,
    payload: error
  };
}

export function signUpUser(formValues: CreateUserRequestBody) {
  return apiClient.post('/signup', formValues);
}

export function loginUser(formValues: /** TODO: replace with actual type when server/session.controller is migrated */ {
  username: string;
  password: string;
}) {
  return apiClient.post('/login', formValues);
}

export function authenticateUser(
  user: PublicUser /** Not sure if UserDocument or PublicUser, to check after relevant route is migrated */
) {
  return {
    type: ActionTypes.AUTH_USER,
    user
  };
}

export function loginUserFailure(error: Error) {
  return {
    type: ActionTypes.AUTH_ERROR,
    error
  };
}

export function setPreferences(preferences: UserPreferences) {
  return {
    type: ActionTypes.SET_PREFERENCES,
    preferences
  };
}

export function validateAndLoginUser(formProps) {
  return (dispatch: Dispatch, getState: GetRootState) => {
    const state = getState();
    const { previousPath } = state.ide;
    return new Promise<void | Error>((resolve) => {
      loginUser(formProps)
        .then((response: { data: PublicUser }) => {
          dispatch(authenticateUser(response.data));
          dispatch(setPreferences(response.data.preferences));
          dispatch(
            setLanguage(response.data.preferences.language, {
              persistPreference: false
            })
          );
          dispatch(justOpenedProject());
          browserHistory.push(previousPath);
          resolve();
        })
        .catch((error) =>
          resolve({
            [FORM_ERROR]: error.response.data.message
          })
        );
    });
  };
}

export function validateAndSignUpUser(formValues) {
  return (dispatch: Dispatch, getState: GetRootState) => {
    const state = getState();
    const { previousPath } = state.ide;
    return new Promise<void | Error>((resolve) => {
      signUpUser(formValues)
        .then((response) => {
          dispatch(authenticateUser(response.data));
          dispatch(justOpenedProject());
          browserHistory.push(previousPath);
          resolve();
        })
        .catch((error) => {
          const { response } = error;
          dispatch(authError(response.data.error));
          resolve({ error });
        });
    });
  };
}

export function getUser() {
  return async (dispatch: Dispatch) => {
    try {
      const response = await apiClient.get('/session');
      const { data } = response;

      if (data?.user === null) {
        return;
      }

      dispatch(authenticateUser(data));
      dispatch({
        type: ActionTypes.SET_PREFERENCES,
        preferences: data.preferences
      });
      setLanguage(data.preferences.language, { persistPreference: false });
    } catch (error: any) {
      const message = error.response
        ? error.response.data.error || error.response.message
        : 'Unknown error.';
      dispatch(authError(message));
    }
  };
}

export function validateSession() {
  return async (dispatch: Dispatch, getState: () => RootState) => {
    try {
      const response = await apiClient.get('/session');
      const state = getState();

      if (state.user.username !== response.data.username) {
        dispatch(showErrorModal('staleSession'));
      }
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        dispatch(showErrorModal('staleSession'));
      }
    }
  };
}

export function resetProject(dispatch: Dispatch) {
  dispatch({
    type: ActionTypes.RESET_PROJECT
  });
  dispatch({
    type: ActionTypes.CLEAR_CONSOLE
  });
  browserHistory.push('/');
}

export function logoutUser() {
  return (dispatch: Dispatch) => {
    apiClient
      .get('/logout')
      .then(() => {
        dispatch({
          type: ActionTypes.UNAUTH_USER
        });
        resetProject(dispatch);
      })
      .catch((error) => {
        const { response } = error;
        dispatch(authError(response.data.error));
      });
  };
}

export function initiateResetPassword(
  formValues: ResetPasswordInitiateRequestBody
) {
  return (dispatch: Dispatch) =>
    new Promise<void | Error>((resolve) => {
      dispatch({
        type: ActionTypes.RESET_PASSWORD_INITIATE
      });
      return apiClient
        .post('/reset-password', formValues)
        .then(() => resolve())
        .catch((error) => {
          const { response } = error;
          dispatch({
            type: ActionTypes.ERROR,
            message: response.data
          });
          resolve({ error });
        });
    });
}

export function initiateVerification() {
  return (dispatch: Dispatch) => {
    dispatch({
      type: ActionTypes.EMAIL_VERIFICATION_INITIATE
    });
    apiClient
      .post('/verify/send', {})
      .then(() => {
        // do nothing
      })
      .catch((error) => {
        const { response } = error;
        dispatch({
          type: ActionTypes.ERROR,
          message: response.data
        });
      });
  };
}

export function verifyEmailConfirmation(
  token: ResetOrUpdatePasswordRequestParams['token']
) {
  return (dispatch: Dispatch) => {
    dispatch({
      type: ActionTypes.EMAIL_VERIFICATION_VERIFY,
      state: 'checking'
    });
    return apiClient
      .get(`/verify?t=${token}`, {})
      .then((response) =>
        dispatch({
          type: ActionTypes.EMAIL_VERIFICATION_VERIFIED,
          message: response.data
        })
      )
      .catch((error) => {
        const { response } = error;
        dispatch({
          type: ActionTypes.EMAIL_VERIFICATION_INVALID,
          message: response.data
        });
      });
  };
}

export function resetPasswordReset() {
  return {
    type: ActionTypes.RESET_PASSWORD_RESET
  };
}

export function validateResetPasswordToken(
  token: ResetOrUpdatePasswordRequestParams['token']
) {
  return (dispatch: Dispatch) => {
    apiClient
      .get(`/reset-password/${token}`)
      .then(() => {
        // do nothing if the token is valid
      })
      .catch(() =>
        dispatch({
          type: ActionTypes.INVALID_RESET_PASSWORD_TOKEN
        })
      );
  };
}

export function updatePassword(
  formValues: UpdatePasswordRequestBody,
  token: ResetOrUpdatePasswordRequestParams['token']
) {
  return (dispatch: Dispatch) =>
    new Promise<void | Error>((resolve) =>
      apiClient
        .post(`/reset-password/${token}`, formValues)
        .then((response) => {
          dispatch(authenticateUser(response.data));
          browserHistory.push('/');
          resolve();
        })
        .catch((error) => {
          dispatch({
            type: ActionTypes.INVALID_RESET_PASSWORD_TOKEN
          });
          resolve({ error });
        })
    );
}

export function updateSettingsSuccess(user: PublicUser) {
  return {
    type: ActionTypes.SETTINGS_UPDATED,
    user
  };
}

/**
 * - Method: `PUT`
 * - Endpoint: `/account`
 * - Authenticated: `true`
 * - Id: `UserController.updateSettings`
 *
 * Description:
 *   - Used to update the user's username, email, or password on the `/account` page while authenticated
 *   - Currently the client only shows the `currentPassword` and `newPassword` fields if no social logins (github & google) are enabled
 */
export function submitSettings(formValues: UpdateSettingsRequestBody) {
  return apiClient.put('/account', formValues);
}

export function updateSettings(formValues: UpdateSettingsRequestBody) {
  return (dispatch: Dispatch) =>
    new Promise<void | Error>((resolve) => {
      if (!formValues.currentPassword && formValues.newPassword) {
        dispatch(showToast(5500));
        dispatch(setToastText('Toast.EmptyCurrentPass'));
        resolve();
        return;
      }
      submitSettings(formValues)
        .then((response) => {
          dispatch(updateSettingsSuccess(response.data));
          dispatch(showToast(5500));
          dispatch(setToastText('Toast.SettingsSaved'));
          resolve();
        })
        .catch((error) => {
          if (error.response) {
            switch (error.response.status) {
              case 401:
                dispatch(showToast(5500));
                dispatch(setToastText('Toast.IncorrectCurrentPass'));
                break;
              case 404:
                dispatch(showToast(5500));
                dispatch(setToastText('Toast.UserNotFound'));
                break;
              default:
                dispatch(showToast(5500));
                dispatch(setToastText('Toast.DefaultError'));
            }
          } else {
            dispatch(showToast(5500));
            dispatch(setToastText('Toast.NetworkError'));
          }
        });
    });
}

export function createApiKeySuccess(user: PublicUser) {
  return {
    type: ActionTypes.API_KEY_CREATED,
    user
  };
}

/**
 * - Method: `POST`
 * - Endpoint: `/account/api-keys`
 * - Authenticated: `true`
 * - Id: `UserController.createApiKey`
 *
 * Description:
 *   - Create API key
 */
export function createApiKey(label: SanitisedApiKey['label']) {
  return (dispatch: Dispatch) =>
    apiClient
      .post('/account/api-keys', { label })
      .then((response) => {
        dispatch(createApiKeySuccess(response.data));
      })
      .catch((error) => {
        const { response } = error;
        Promise.reject(new Error(response.data.error));
      });
}

/**
 * - Method: `DELETE`
 * - Endpoint: `/account/api-keys/:keyId`
 * - Authenticated: `true`
 * - Id: `UserController.removeApiKey`
 *
 * Description:
 *   - Remove API key
 */
export function removeApiKey(keyId: SanitisedApiKey['id']) {
  return (dispatch: Dispatch) =>
    apiClient
      .delete(`/account/api-keys/${keyId}`)
      .then((response) => {
        dispatch({
          type: ActionTypes.API_KEY_REMOVED,
          user: response.data
        });
      })
      .catch((error) => {
        const { response } = error;
        Promise.reject(new Error(response.data.error));
      });
}

export function unlinkService(service: string) {
  return (dispatch: Dispatch) => {
    if (!['github', 'google'].includes(service)) return;
    apiClient
      .delete(`/auth/${service}`)
      .then((response) => {
        dispatch(authenticateUser(response.data));
      })
      .catch((error) => {
        const { response } = error;
        const message = response.message || response.data.error;
        dispatch(authError(message));
      });
  };
}

/**
 * - Method: `PUT`
 * - Endpoint: `/cookie-consent`
 * - Authenticated: `true`
 * - Id: `UserController.updatePreferences`
 *
 * Description:
 *   - Update user cookie consent
 */
export function setUserCookieConsent(cookieConsent: CookieConsentOptions) {
  // maybe also send this to the server rn?
  return (dispatch: Dispatch) => {
    apiClient
      .put('/cookie-consent', { cookieConsent })
      .then(() => {
        dispatch({
          type: ActionTypes.SET_COOKIE_CONSENT,
          cookieConsent
        });
      })
      .catch((error) => {
        const { response } = error;
        const message = response.message || response.data.error;
        dispatch(authError(message));
      });
  };
}
