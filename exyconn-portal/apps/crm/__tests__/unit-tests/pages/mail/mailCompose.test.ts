import { describe, expect, it } from 'vitest';
import { CrmEmailDirection, CrmTimelineObject } from '@exyconn/shell/graphql/generated';
import { composeFor, senderOf } from '../../../../src/pages/mail/mailCompose';
import { message, SALES, thread } from './mail-fixtures';

const words = { wrote: 'On Tuesday, Asha wrote:', forwarded: '--- Forwarded ---' };

describe('composeFor', () => {
  it('replies to the sender in the same thread and mailbox, quoting the message', () => {
    const open = thread();
    expect(composeFor(open, open.messages[0], 'reply', words)).toEqual({
      object: 'CONTACT',
      id: 'c1',
      fromAccountId: 'g1',
      to: ['asha@globex.io'],
      cc: [],
      subject: 'Re: Pricing',
      body: '\n\nOn Tuesday, Asha wrote:\n> Can you share\n> the price list?',
      threadId: 't1',
      inReplyTo: '<m1@globex.io>',
    });
  });

  it('replies to the sender, copies everyone else but the mailbox, and files under the company', () => {
    const open = thread({
      record: { object: CrmTimelineObject.Company, id: 'co1', name: 'Globex' },
    });
    const context = composeFor(open, open.messages[0], 'replyAll', words);
    expect(context.to).toEqual(['asha@globex.io']);
    expect(context.cc).toEqual(['ops@globex.io']);
    expect(context).toMatchObject({ object: 'COMPANY', id: 'co1' });
  });

  it('answers the recipients when the mailbox wrote every message', () => {
    const sent = message({ direction: CrmEmailDirection.Out, fromAddress: SALES, to: ['bo@x.io'] });
    const open = thread({ record: null, messages: [sent] });
    expect(composeFor(open, sent, 'reply', words)).toMatchObject({
      object: 'CONTACT',
      id: '',
      to: ['bo@x.io'],
    });
  });

  it('forwards with no recipient, a Fwd subject and the message below the header', () => {
    const open = thread();
    const context = composeFor(open, open.messages[0], 'forward', words);
    expect(context).toEqual({
      object: 'CONTACT',
      id: 'c1',
      fromAccountId: 'g1',
      to: [],
      subject: 'Fwd: Pricing',
      body: '\n\n--- Forwarded ---\nCan you share\nthe price list?',
    });
    expect(
      composeFor(thread({ subject: 'Fwd: x' }), open.messages[0], 'forward', words).subject,
    ).toBe('Fwd: x');
  });

  it('writes the sender with the name when there is one', () => {
    expect(senderOf(message())).toBe('Asha <asha@globex.io>');
    expect(senderOf(message({ fromName: '' }))).toBe('asha@globex.io');
  });
});
