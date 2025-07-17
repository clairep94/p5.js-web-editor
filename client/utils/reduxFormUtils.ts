import i18n from 'i18next';
import type { InputHTMLAttributes } from 'react';

/* eslint-disable */
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

type GenericFormErrors = {
  [key: string]: string
};

function validateNameEmail(
  formProps: { username?: string, email?: string },
  errors: { username?: string, email?: string }
) {
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

export function validateSettings(formProps: {
  username?: string,
  email?: string,
  currentPassword?: string,
  newPassword?: string
}) {
  const errors: GenericFormErrors = {};

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

export function validateLogin(formProps: {
  username?: string,
  email?: string,
  password?: string
}): {
  username?: string,
  email?: string,
  password?: string
} {
  const errors: GenericFormErrors = {};
  if (!formProps.email && !formProps.username) {
    errors.email = i18n.t('ReduxFormUtils.errorEmptyEmailorUserName');
  }
  if (!formProps.password) {
    errors.password = i18n.t('ReduxFormUtils.errorEmptyPassword');
  }
  return errors;
}

function validatePasswords(
  formProps: {
    password?: string,
    confirmPassword?: string
  },
  errors: GenericFormErrors
) {
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

export function validateNewPassword(formProps: {
  password?: string,
  confirmPassword?: string
}): {
  password?: string,
  confirmPassword?: string
} {
  const errors = {};
  validatePasswords(formProps, errors);
  return errors;
}

export function validateSignup(formProps: {
  email?: string,
  username?: string,
  password?: string,
  confirmPassword?: string
}): {
  email?: string,
  username?: string,
  password?: string,
  confirmPassword?: string
} {
  const errors = {};

  validateNameEmail(formProps, errors);
  validatePasswords(formProps, errors);

  return errors;
}

export function validateResetPassword(formProps: {
  email?: string
}): {
  email?: string
} {
  const errors: { email?: string } = {};
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
