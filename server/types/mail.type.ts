interface BaseMailTemplate {
  domain: string;
  headingText: string;
  greetingText: string;
  messageText: string;
  directLinkText: string;
  noteText: string;
  meta: { keywords: string; description: string };
}

/** Email template for account consolidation, when user has previously registered with another account */
export interface AccountConsolidationMailTemplate extends BaseMailTemplate {
  username: string;
  email: string;
  message2Text: string;
  resetPasswordLink: string;
  resetPasswordText: string;
}
/** Email options for account consolidation, when user has previously registered with another account */
export interface AccountConsolidationMailOptions {
  body: {
    domain: string;
    username: string;
    email: string;
  };
  to: string;
}

/** Standard email template, used for email confirmation & password reset */
export interface MailTemplate extends BaseMailTemplate {
  link: string;
  buttonText: string;
}
/** Standard email options, used for email confirmation & password reset */
export interface MailOptions {
  body: {
    domain: string;
    link: string;
  };
  to: string;
}
