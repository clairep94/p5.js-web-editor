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

/** Standard email template */
export interface MailTemplate extends BaseMailTemplate {
  link: string;
  buttonText: string;
}
