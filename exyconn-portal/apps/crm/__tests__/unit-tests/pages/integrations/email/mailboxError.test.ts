import { describe, expect, it } from 'vitest';
import { describeMailboxError } from '../../../../../src/pages/integrations/email/mailboxError';

const CONSOLE =
  'https://console.developers.google.com/apis/api/gmail.googleapis.com/overview?project=123456';
const disabledBody = {
  error: {
    code: 403,
    message: `Gmail API has not been used in project 123456 before or it is disabled. Enable it by visiting ${CONSOLE} then retry.`,
    status: 'PERMISSION_DENIED',
  },
};

describe('describeMailboxError', () => {
  it('reads a disabled Gmail API: send failed, Google’s reason, and the console link it gave', () => {
    const text = `Gmail /messages/send failed (403): ${JSON.stringify(disabledBody)}`;

    const info = describeMailboxError(text);

    expect(info.label).toBe('Send failed');
    expect(info.summary).toBe(disabledBody.error.message);
    expect(info.fix).toBe(
      'Enable the Gmail API for this Google Cloud project, then test the mailbox again.',
    );
    expect(info.fixUrl).toBe(CONSOLE);
    expect(info.details).toBe(
      `Gmail /messages/send failed (403):\n${JSON.stringify(disabledBody, null, 2)}`,
    );
  });

  it('still finds the message in a JSON body that was cut short', () => {
    const text =
      'Gmail /messages/send failed (403): { "error": { "code": 403, "message": "Gmail API has not been used in project 9 before or it is disabled. Enable it by visiting https://console.developers.google.com/apis/api/gmail.googl';

    const info = describeMailboxError(text);

    expect(info.summary).toMatch(/^Gmail API has not been used in project 9/);
    expect(info.details).toBe(text);
    expect(info.fixUrl).toBe('https://console.developers.google.com/apis/api/gmail.googl');
  });

  it('tells a sync failure, a test failure and anything else apart', () => {
    expect(describeMailboxError('Gmail /threads failed (500): busy').label).toBe('Sync failed');
    expect(describeMailboxError('Microsoft Graph /me failed (500): busy').label).toBe(
      'Test failed',
    );
    expect(describeMailboxError('Microsoft refused: AADSTS50011').label).toBe('Error');
  });

  it('asks for a reconnect on a revoked sign-in or missing permissions, without a link', () => {
    const revoked = describeMailboxError(
      'Google refused the connection to a@x.io: Token has been expired or revoked. Connect it again.',
    );
    const scopes = describeMailboxError(
      'Gmail /messages/send failed (403): {"error":{"message":"Request had insufficient authentication scopes."}}',
    );

    expect(revoked.fix).toBe('Reconnect the mailbox: its sign-in expired or was revoked.');
    expect(revoked.fixUrl).toBeUndefined();
    expect(scopes.fix).toBe(
      'Reconnect the mailbox and allow every permission the sign-in page asks for.',
    );
    expect(scopes.summary).toBe('Request had insufficient authentication scopes.');
  });

  it('offers no fix for an error it does not know, and keeps the text as it is', () => {
    const info = describeMailboxError('Gmail /threads failed (500): Backend Error');

    expect(info).toEqual({
      label: 'Sync failed',
      summary: 'Gmail /threads failed (500): Backend Error',
      details: 'Gmail /threads failed (500): Backend Error',
      fix: undefined,
      fixUrl: undefined,
    });
  });
});
