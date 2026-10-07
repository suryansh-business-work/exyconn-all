import { describe, expect, it } from 'vitest';
import { SupportCategory, SupportPriority } from '@exyconn/shell/graphql/generated';
import {
  OPEN_TICKET_DEFAULTS,
  openTicketSchema,
} from '../../../../../src/pages/support/forms/open-ticket';
import { ticketReplySchema } from '../../../../../src/pages/support/forms/ticket-reply';

const messages = (result: { error?: { issues: { message: string }[] } }) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

const valid = {
  subject: 'Invoice total looks wrong',
  category: SupportCategory.Other,
  description: 'The March invoice charges twice for the same week of work.',
  priority: SupportPriority.High,
};

describe('openTicketSchema', () => {
  it('accepts a complete ticket', () => {
    expect(openTicketSchema.safeParse(valid).success).toBe(true);
  });

  it('starts blank, about something else, at medium priority — and blank is not sendable', () => {
    expect(OPEN_TICKET_DEFAULTS.category).toBe(SupportCategory.Other);
    expect(OPEN_TICKET_DEFAULTS.priority).toBe(SupportPriority.Medium);
    expect(messages(openTicketSchema.safeParse(OPEN_TICKET_DEFAULTS))).toEqual([
      'One line about what is wrong',
      'A few sentences help us pick it up faster',
    ]);
  });

  it('enforces the length limits the API enforces', () => {
    const tooLong = { ...valid, subject: 'x'.repeat(121), description: 'y'.repeat(4001) };
    expect(messages(openTicketSchema.safeParse(tooLong))).toEqual([
      'Keep the title under 120 characters',
      'Keep it under 4000 characters',
    ]);
    const atLimit = { ...valid, subject: 'x'.repeat(120), description: 'y'.repeat(4000) };
    expect(openTicketSchema.safeParse(atLimit).success).toBe(true);
  });

  it('rejects a category or priority the API does not know', () => {
    expect(openTicketSchema.safeParse({ ...valid, category: 'BILLING' }).success).toBe(false);
    expect(openTicketSchema.safeParse({ ...valid, priority: 'URGENT' }).success).toBe(false);
  });
});

describe('ticketReplySchema', () => {
  it('requires some text, not just spaces', () => {
    expect(messages(ticketReplySchema.safeParse({ body: '   ' }))).toEqual(['Write a reply']);
  });

  it('caps a reply at 5000 characters', () => {
    expect(ticketReplySchema.safeParse({ body: 'a'.repeat(5000) }).success).toBe(true);
    expect(messages(ticketReplySchema.safeParse({ body: 'a'.repeat(5001) }))).toEqual([
      'Keep it under 5000 characters',
    ]);
  });
});
