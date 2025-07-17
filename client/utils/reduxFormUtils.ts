import i18n from 'i18next';
import type { InputHTMLAttributes } from 'react';

/* eslint-disable */
/**
 * Strips non-DOM props from a form field and returns only valid DOM props.
 * @param {any} props - Props passed into a form field component.
 * @returns {InputHTMLAttributes<HTMLInputElement>} - Clean DOM-compatible props.
 */
export const domOnlyProps = (
  props: any
): InputHTMLAttributes<HTMLInputElement> => {
  const {
    initialValue,
    autofill,
    onUpdate,
    valid,
    invalid,
    dirty,
    pristine,
    active,
    touched,
    visited,
    autofilled,
    error,
    ...domProps
  } = props;
  return domProps;
};
/* eslint-enable */

/* eslint-disable */
const EMAIL_REGEX = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i;
/* eslint-enable */

// eslint-disable-next-line
type FormErrors<T> = Partial<Record<keyof T, string>>;

type LoginForm = {
  username?: string;
  email?: string;
  password?: string;
};

type SignupForm = {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

type SettingsForm = {
  username?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
};

type NewPasswordForm = {
  password?: string;
  confirmPassword?: string;
};

type ResetPasswordForm = {
  email?: string;
};

type GenericFormErrors =  {
  [key: string]: string
}

/**
 * Validates username and email fields and transforms the error param
 * @param formProps 
 * @param errors 
 */
function validateNameEmail(
  formProps: { username?: string, email?: string },
  errors: GenericFormErrors
): void {
  if (!formProps.username) {
    errors.username = i18n.t('ReduxFormUtils.errorEmptyUsername');
  } else if (!formProps.username.match(/^.{1,20}$/)) {
    errors.username = i18n.t('ReduxFormUtils.errorLongUsername');
  } else if (!formProps.username.match(/^[a-zA-Z0-9._-]{1,20}$/)) {
    errors.username = i18n.t('ReduxFormUtils.errorValidUsername');
  }

  if (!formProps.email) {
    errors.email = i18n.t('ReduxFormUtils.errorEmptyEmail');
  } else if (
    // eslint-disable-next-line max-len
    !formProps.email.match(EMAIL_REGEX)
  ) {
    errors.email = i18n.t('ReduxFormUtils.errorInvalidEmail');
  }
}

/**
 * Validates the password and confirm password, and transforms the error param
 * @param formProps 
 * @param errors 
 */
function validatePasswords(
  formProps: {
    password?: string,
    confirmPassword?: string
  },
  errors: GenericFormErrors
): void {
  if (!formProps.password) {
    errors.password = i18n.t('ReduxFormUtils.errorEmptyPassword');
  }
  if (formProps.password && formProps.password.length < 6) {
    errors.password = i18n.t('ReduxFormUtils.errorShortPassword');
  }
  if (!formProps.confirmPassword) {
    errors.confirmPassword = i18n.t('ReduxFormUtils.errorConfirmPassword');
  }

  if (
    formProps.password !== formProps.confirmPassword &&
    formProps.confirmPassword
  ) {
    errors.confirmPassword = i18n.t('ReduxFormUtils.errorPasswordMismatch');
  }
}

/**
 * @param formProps 
 * @returns Object containing validation errors for each field in the settings form
 */
export function validateSettings(formProps: SettingsForm): FormErrors<SettingsForm> {
  const errors: FormErrors<SettingsForm> = {};

  validateNameEmail(formProps, errors);

  if (formProps.currentPassword && !formProps.newPassword) {
    errors.newPassword = i18n.t('ReduxFormUtils.errorNewPassword');
  }
  if (formProps.newPassword && formProps.newPassword.length < 6) {
    errors.newPassword = i18n.t('ReduxFormUtils.errorShortPassword');
  }
  if (
    formProps.newPassword &&
    formProps.currentPassword === formProps.newPassword
  ) {
    errors.newPassword = i18n.t('ReduxFormUtils.errorNewPasswordRepeat');
  }
  return errors;
}

/**
 * @param formProps 
 * @returns Object containing validation errors for each field in the login form
 */
export function validateLogin(formProps: LoginForm): FormErrors<LoginForm> {
  const errors: FormErrors<LoginForm> = {};
  if (!formProps.email && !formProps.username) {
    errors.email = i18n.t('ReduxFormUtils.errorEmptyEmailorUserName');
  }
  if (!formProps.password) {
    errors.password = i18n.t('ReduxFormUtils.errorEmptyPassword');
  }
  return errors;
}

/**
 * @param formProps 
 * @returns Object containing validation errors for each field in the new password form
 */
export function validateNewPassword(formProps: NewPasswordForm): FormErrors<NewPasswordForm> {
  const errors = {};
  validatePasswords(formProps, errors);
  return errors;
}

/**
 * @param formProps 
 * @returns Object containing validation errors for each field in the signup form
 */
export function validateSignup(formProps: SignupForm): FormErrors<SignupForm> {
  const errors = {};

  validateNameEmail(formProps, errors);
  validatePasswords(formProps, errors);

  return errors;
}

/**
 * @param formProps 
 * @returns Object containing validation errors for each field in the reset password form
 */
export function validateResetPassword(formProps: ResetPasswordForm): FormErrors<ResetPasswordForm> {
  const errors: FormErrors<ResetPasswordForm> = {};
  if (!formProps.email) {
    errors.email = i18n.t('ReduxFormUtils.errorEmptyEmail');
  } else if (
    // eslint-disable-next-line max-len
    !formProps.email.match(EMAIL_REGEX)
  ) {
    errors.email = i18n.t('ReduxFormUtils.errorInvalidEmail');
  }
  return errors;
}
