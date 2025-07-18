import { MailChimpConfig } from "../types/mailchimp";

export const getMailChimpConfig = (): MailChimpConfig => {
  return {
    clientId: process.env.MAILCHIMP_CLIENT_ID || "741151044464",
    clientSecret:
      process.env.MAILCHIMP_CLIENT_SECRET ||
      "274283b1a39ed2a0316f248d97a8e7e58e42dfa153667bb8c0",
    redirectUri:
      process.env.MAILCHIMP_REDIRECT_URI ||
      "http://127.0.0.1:3001/oauth-verify/mailchimp",
  };
};

export const MAILCHIMP_OAUTH_URL = "https://login.mailchimp.com/oauth2/token";
export const MAILCHIMP_METADATA_URL =
  "https://login.mailchimp.com/oauth2/metadata";
