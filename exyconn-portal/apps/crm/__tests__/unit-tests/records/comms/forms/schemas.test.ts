import { describe, expect, it } from 'vitest';
import { callNoteSchema } from '../../../../../src/records/comms/forms/call-note';
import { recipientOptions } from '../../../../../src/records/comms/forms/recipient';
import { MAX_SMS_LENGTH, sendSmsSchema } from '../../../../../src/records/comms/forms/send-sms';
import { startCallSchema } from '../../../../../src/records/comms/forms/start-call';

const messages = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('comms form schemas', () => {
  it('offers each record number, dialled without punctuation', () => {
    expect(recipientOptions(['+1 (415) 555-0100'])).toEqual([
      { value: '+14155550100', label: '+1 (415) 555-0100' },
    ]);
  });

  it('accepts an SMS to an international number, trimmed', () => {
    expect(sendSmsSchema.parse({ to: ' +14155550100 ', body: ' Hi ' })).toEqual({
      to: '+14155550100',
      body: 'Hi',
    });
  });

  it('asks for a number and a message', () => {
    expect(messages(sendSmsSchema.safeParse({ to: ' ', body: '  ' }))).toEqual([
      'Choose the number',
      'This number is not in international format. Save it on the record as e.g. +14155550100 first.',
      'Write the message',
    ]);
  });

  it('caps an SMS at the server limit', () => {
    const at = 'x'.repeat(MAX_SMS_LENGTH);
    expect(sendSmsSchema.safeParse({ to: '+14155550100', body: at }).success).toBe(true);
    expect(messages(sendSmsSchema.safeParse({ to: '+14155550100', body: `${at}x` }))).toEqual([
      'Keep the message under 1000 characters',
    ]);
  });

  it('needs the agent phone in international format for a call', () => {
    expect(messages(startCallSchema.safeParse({ to: '+14155550100', agentPhone: '' }))).toEqual([
      'Enter your phone number',
      'Enter your number in international format, e.g. +14155550100',
    ]);
    expect(
      messages(startCallSchema.safeParse({ to: '+14155550100', agentPhone: '0415 555' })),
    ).toEqual(['Enter your number in international format, e.g. +14155550100']);
    expect(
      startCallSchema.safeParse({ to: '+14155550100', agentPhone: '+442079460958' }).success,
    ).toBe(true);
  });

  it('needs call notes between 1 and 10,000 characters', () => {
    expect(messages(callNoteSchema.safeParse({ notes: '   ' }))).toEqual(['Write the note']);
    expect(callNoteSchema.safeParse({ notes: 'x'.repeat(10_000) }).success).toBe(true);
    expect(messages(callNoteSchema.safeParse({ notes: 'x'.repeat(10_001) }))).toEqual([
      'Keep the notes under 10,000 characters',
    ]);
  });
});
