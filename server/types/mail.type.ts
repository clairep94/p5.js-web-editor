export interface MailTemplate {
  domain: string;
  headingText: string;
  greetingText: string;
  messageText: string;
  username: string;
  email: string;
  message2Text: string;
  resetPasswordLink: string;
  directLinkText: string;
  resetPasswordText: string;
  noteText: string;
  meta: { keywords: string; description: string };
}
