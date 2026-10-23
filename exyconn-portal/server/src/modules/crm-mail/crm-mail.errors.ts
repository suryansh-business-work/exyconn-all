import { GraphQLError } from 'graphql';
import { ConfigurationError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { GmailApiError, GmailAuthError } from '../gmail/gmail.client';

/** What CRM > Mail tells a person when Gmail refuses, in words that say what to do next. */

/** Google's words when the Gmail API is switched off in the client's Cloud project. */
const API_DISABLED =
  /SERVICE_DISABLED|accessNotConfigured|has not been used in project|is disabled/i;

export const GMAIL_API_DISABLED =
  'The Gmail API is turned off in the Google Cloud project behind the Gmail client. Ask Tech to open Google Cloud console > APIs & Services > Library, search for "Gmail API", select Enable, wait a few minutes and then sync again.';

/** The sentence for one failure of one mailbox. */
export function explainMailError(error: unknown, email: string): string {
  if (error instanceof GraphQLError) {
    return error.message;
  }
  if (error instanceof GmailAuthError) {
    return `Google refused the connection to ${email}. Reconnect it in CRM > Integrations > Email.`;
  }
  if (!(error instanceof GmailApiError)) {
    return `Gmail did not answer for ${email}. Try again in a moment.`;
  }
  if (error.status === 403 && API_DISABLED.test(error.message)) {
    return GMAIL_API_DISABLED;
  }
  if (error.status === 403) {
    return `${email} did not give the CRM permission to read and change its mail. Reconnect it in CRM > Integrations > Email and allow everything Google asks for.`;
  }
  if (error.status === 429) {
    return `Gmail is limiting requests from ${email}. Wait a minute and try again.`;
  }
  if (error.status === 404) {
    return 'That conversation is no longer in Gmail. Sync the mailbox to refresh the list.';
  }
  return `Gmail did not answer for ${email}. Try again in a moment.`;
}

/** Logs the provider's own words and throws the explanation to the person who asked. */
export function mailFailure(error: unknown, email: string, action: string): never {
  logger.warn({ err: error, mailbox: email, action }, 'CRM mail: Gmail call failed');
  if (error instanceof GraphQLError || error instanceof ConfigurationError) {
    throw error;
  }
  const limited = error instanceof GmailApiError && error.status === 429;
  throw new GraphQLError(explainMailError(error, email), {
    extensions: { code: limited ? 'TOO_MANY_REQUESTS' : 'BAD_REQUEST' },
  });
}
