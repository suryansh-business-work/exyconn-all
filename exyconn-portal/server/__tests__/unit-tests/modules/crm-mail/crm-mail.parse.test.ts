import { GraphQLError } from 'graphql';
import { GmailApiError, GmailAuthError } from '../../../../src/modules/gmail/gmail.client';
import {
  explainMailError,
  GMAIL_API_DISABLED,
  mailFailure,
} from '../../../../src/modules/crm-mail/crm-mail.errors';
import { mapLimit } from '../../../../src/modules/crm-mail/crm-mail.gmail';
import { parseAddresses } from '../../../../src/modules/crm-mail/crm-mail.parse';
import { ConfigurationError } from '../../../../src/utils/errors';

const SALES = 'sales@exyconn.test';

describe('parseAddresses', () => {
  it('keeps a quoted name with a comma whole and lower-cases every address', () => {
    expect(parseAddresses('"Kumar, Asha" <Asha@Acme.test>, b@x.test, not-an-address')).toEqual([
      { name: 'Kumar, Asha', address: 'asha@acme.test' },
      { name: '', address: 'b@x.test' },
    ]);
  });
});

describe('explainMailError', () => {
  it.each([
    [
      new GmailAuthError('revoked'),
      `Google refused the connection to ${SALES}. Reconnect it in CRM > Integrations > Email.`,
    ],
    [
      new GmailApiError('Gmail API has not been used in project 1 before or it is disabled', 403),
      GMAIL_API_DISABLED,
    ],
    [
      new GmailApiError('insufficientPermissions', 403),
      `${SALES} did not give the CRM permission to read and change its mail. Reconnect it in CRM > Integrations > Email and allow everything Google asks for.`,
    ],
    [
      new GmailApiError('backend', 500),
      `Gmail did not answer for ${SALES}. Try again in a moment.`,
    ],
    [new Error('fetch failed'), `Gmail did not answer for ${SALES}. Try again in a moment.`],
    [new GraphQLError('Too many requests to this mailbox.'), 'Too many requests to this mailbox.'],
  ])('says what to do about %s', (error, sentence) => {
    expect(explainMailError(error, SALES)).toBe(sentence);
  });

  it('throws Gmail rate limits as TOO_MANY_REQUESTS and passes setup errors through', () => {
    const limited = () => mailFailure(new GmailApiError('rateLimitExceeded', 429), SALES, 'STAR');
    expect(limited).toThrow(expect.objectContaining({ extensions: { code: 'TOO_MANY_REQUESTS' } }));
    const setup = new ConfigurationError('Gmail is not set up.');
    expect(() => mailFailure(setup, SALES, 'STAR')).toThrow(setup);
  });
});

describe('mapLimit', () => {
  it('keeps the order of the items and never runs more than the limit at once', async () => {
    let running = 0;
    let peak = 0;
    const doubled = await mapLimit([1, 2, 3, 4, 5], 2, async (item) => {
      running += 1;
      peak = Math.max(peak, running);
      await new Promise((resolve) => setTimeout(resolve, 5));
      running -= 1;
      return item * 2;
    });
    expect(doubled).toEqual([2, 4, 6, 8, 10]);
    expect(peak).toBe(2);
  });
});
