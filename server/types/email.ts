import type { SendMailOptions } from 'nodemailer';

// -------- EMAIL OPTIONS --------
/** Node mailer options for the account consolidation email */
export interface AccountConsolidationEmailOptions extends SendMailOptions {
  body: {
    domain: string;
    username: string;
    email: string;
  };
}
/** Node mailer options for the reset password email */
export interface ResetPasswordEmailOptions extends SendMailOptions {
  body: {
    domain: string;
    link: string;
  };
}
/** Node mailer options for the confirm email email */
export interface ConfirmEmailEmailOptions extends SendMailOptions {
  body: {
    domain: string;
    link: string;
  };
}

// -------- EMAIL RENDERING TEMPLATES --------
/** Base template for emails */
export interface BaseEmailTemplate {
  domain: string;
  headingText: string;
  greetingText: string;
  messageText: string;
  directLinkText: string;
  noteText: string;
  meta: {
    keywords: string;
    description: string;
  };
}
/** Primary button on emails, which contains text and a link */
export interface EmailPrimaryButton {
  link: string;
  buttonText: string;
}
/** Template for rendering the account consolidation email */
export interface AccountConsolidationEmailTemplate extends BaseEmailTemplate {
  username: string;
  email: string;
  message2Text: string;
  resetPasswordLink: string;
  resetPasswordText: string;
}
/** Template for rendering the confirm email email */
export interface ConfirmEmailEmailTemplate
  extends BaseEmailTemplate,
    EmailPrimaryButton {}
/** Template for rendering the reset password email */
export interface ResetPasswordEmailTemplate
  extends BaseEmailTemplate,
    EmailPrimaryButton {}
