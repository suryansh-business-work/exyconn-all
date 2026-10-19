import {
  MAX_SMS_LENGTH,
  checkedPhone,
  checkedSmsBody,
  parseCallConfig,
  parseSmsConfig,
} from '../../../../src/modules/crm-integrations/crm-integrations.validation';
import { msg91Input, twilioInput, vobizInput } from './fixtures';

describe('call config parsing', () => {
  it('accepts a Twilio account and trims its fields', () => {
    const values = parseCallConfig(twilioInput({ label: '  Main line  ' }));
    expect(values).toMatchObject({ provider: 'TWILIO', label: 'Main line', isActive: true });
  });

  it('accepts a Vobiz account by its Auth ID', () => {
    expect(parseCallConfig(vobizInput()).accountId).toBe('MA_VOBIZ01');
  });

  it('refuses with the first problem, in the form words', () => {
    expect(() => parseCallConfig(twilioInput({ label: ' ' }))).toThrow('Give it a name');
    expect(() => parseCallConfig(twilioInput({ accountId: 'XY123' }))).toThrow(
      'A Twilio Account SID starts with AC',
    );
    expect(() => parseCallConfig(twilioInput({ fromNumber: '0987654321' }))).toThrow(
      'Enter the number in international format',
    );
    expect(() => parseCallConfig(vobizInput({ accountId: 'no' }))).toThrow(
      'Enter the Vobiz Auth ID',
    );
    expect(() => parseCallConfig(twilioInput({ authToken: 'x'.repeat(201) }))).toThrow(
      'That token is too long',
    );
  });

  it('refuses a provider calls cannot use', () => {
    expect(() => parseCallConfig(msg91Input())).toThrow();
    expect(() => parseCallConfig(null)).toThrow();
  });
});

describe('SMS config parsing', () => {
  it('accepts an MSG91 flow template and a Twilio account', () => {
    expect(parseSmsConfig(msg91Input())).toMatchObject({
      senderId: 'EXYCON',
      templateId: 'flow-123',
    });
    expect(parseSmsConfig(twilioInput()).provider).toBe('TWILIO');
  });

  it('refuses MSG91 details that are not in the DLT shapes', () => {
    expect(() => parseSmsConfig(msg91Input({ senderId: 'AB' }))).toThrow('Enter the DLT sender id');
    expect(() => parseSmsConfig(msg91Input({ templateId: '' }))).toThrow(
      'Enter the MSG91 flow template id',
    );
    expect(() => parseSmsConfig(msg91Input({ messageVariable: '1message' }))).toThrow(
      'Enter the template variable',
    );
    expect(() => parseSmsConfig(vobizInput())).toThrow();
  });
});

describe('numbers and texts the CRM sends', () => {
  it('keeps a trimmed E.164 number', () => {
    expect(checkedPhone('  +14155550100 ', 'the number')).toBe('+14155550100');
  });

  it('says how to write a number that is not E.164', () => {
    expect(() => checkedPhone('098765 43210', 'your phone number')).toThrow(
      'Enter your phone number in international format, e.g. +14155550100.',
    );
  });

  it('keeps a message of 1 to the maximum characters, trimmed', () => {
    expect(checkedSmsBody('  Hello  ')).toBe('Hello');
    expect(checkedSmsBody('a'.repeat(MAX_SMS_LENGTH))).toHaveLength(MAX_SMS_LENGTH);
  });

  it('refuses an empty or over-long message', () => {
    const refusal = `Write a message of 1 to ${MAX_SMS_LENGTH} characters.`;
    expect(() => checkedSmsBody('   ')).toThrow(refusal);
    expect(() => checkedSmsBody('a'.repeat(MAX_SMS_LENGTH + 1))).toThrow(refusal);
  });
});
