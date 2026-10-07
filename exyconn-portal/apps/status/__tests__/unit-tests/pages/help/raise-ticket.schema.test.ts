import { describe, expect, it } from 'vitest';
import {
  RAISE_TICKET_DEFAULTS,
  raiseTicketSchema,
} from '../../../../src/pages/help/forms/raise-ticket';
import { ticketInput } from './help.fixtures';

const messagesFor = (overrides: Record<string, unknown>) => {
  const result = raiseTicketSchema.safeParse({ ...ticketInput, ...overrides });
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
};

describe('raiseTicketSchema', () => {
  it('accepts a complete ticket', () => {
    expect(messagesFor({})).toEqual([]);
  });

  it('defaults to an "other" question of medium urgency, with every text empty', () => {
    expect(RAISE_TICKET_DEFAULTS).toMatchObject({
      category: 'OTHER',
      priority: 'MEDIUM',
      subject: '',
    });
    expect(raiseTicketSchema.safeParse(RAISE_TICKET_DEFAULTS).success).toBe(false);
  });

  it.each([
    ['requesterName', 'a'.repeat(80), 'a'.repeat(81), 'Keep the name under 80 characters'],
    ['subject', 's'.repeat(120), 's'.repeat(121), 'Keep the title under 120 characters'],
    ['description', 'd'.repeat(4000), 'd'.repeat(4001), 'Keep it under 4000 characters'],
  ])('caps %s at the API limit', (field, longest, tooLong, message) => {
    expect(messagesFor({ [field]: longest })).toEqual([]);
    expect(messagesFor({ [field]: tooLong })).toEqual([message]);
  });

  it('measures lengths after trimming', () => {
    expect(messagesFor({ requesterName: '  a  ' })).toEqual(['Tell us who you are']);
  });

  it('only takes categories and priorities the desk knows', () => {
    expect(messagesFor({ category: 'GARDENING', priority: 'URGENT' })).toHaveLength(2);
  });
});
