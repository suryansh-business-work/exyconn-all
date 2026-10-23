import { describe, expect, it } from 'vitest';
import { connectResultOf, mailboxReturnUrl } from '@/components/email/mailboxConnect';

describe('mailboxConnect', () => {
  it('marks the page the person is on as the way back, keeping its own query', () => {
    expect(mailboxReturnUrl('https://hr.exyconn.com/people?tab=all')).toBe(
      'https://hr.exyconn.com/people?tab=all&myMailbox=1',
    );
  });

  it('reads a connected address or a refusal only on a marked return', () => {
    const connected = new URLSearchParams('myMailbox=1&gmailConnected=me@acme.io');
    const refused = new URLSearchParams('myMailbox=1&microsoftError=Cancelled');

    expect(connectResultOf(connected)).toEqual({ text: 'me@acme.io', failed: false });
    expect(connectResultOf(refused)).toEqual({ text: 'Cancelled', failed: true });
  });

  it('ignores a CRM connect and a marked page with no outcome', () => {
    expect(connectResultOf(new URLSearchParams('gmailConnected=sales@acme.io'))).toBeNull();
    expect(connectResultOf(new URLSearchParams('myMailbox=1'))).toBeNull();
  });
});
