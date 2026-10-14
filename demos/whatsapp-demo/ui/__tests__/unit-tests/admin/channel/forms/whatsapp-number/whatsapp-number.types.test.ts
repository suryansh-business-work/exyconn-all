import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  makeWhatsappNumberSchema,
  toWhatsappNumberValues,
  type WhatsappNumberFormValues,
} from '../../../../../../src/admin/channel/forms/whatsapp-number';
import { channelRow } from '../../../admin.fixtures';

/** Credentials of a given length, built at runtime rather than written into the test. */
const credential = (length: number) => 'k'.repeat(length);

const valid = (overrides: Partial<WhatsappNumberFormValues> = {}): WhatsappNumberFormValues => ({
  phoneNumberId: '1234567890',
  displayPhone: '+1 555 010 0000',
  accessToken: credential(20),
  appSecret: credential(16),
  verifyToken: 'verify-token',
  enabled: true,
  ...overrides,
});

/** The first message a parse fails with, by field — what the form shows under it. */
function errorsOf(isEdit: boolean, values: WhatsappNumberFormValues): Record<string, string> {
  const result = makeWhatsappNumberSchema(isEdit).safeParse(values);
  const errors: Record<string, string> = {};
  if (result.success) {
    return errors;
  }
  for (const issue of result.error.issues) {
    const field = issue.path.join('.');
    errors[field] = errors[field] ?? issue.message;
  }
  return errors;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('makeWhatsappNumberSchema', () => {
  it('accepts a complete first connection and trims what was typed', () => {
    const parsed = makeWhatsappNumberSchema(false).parse(
      valid({ phoneNumberId: ' 1234567890 ', verifyToken: '  verify-token ' }),
    );
    expect(parsed.phoneNumberId).toBe('1234567890');
    expect(parsed.verifyToken).toBe('verify-token');
  });

  it('requires the phone number ID, as the digits Meta shows', () => {
    expect(errorsOf(false, valid({ phoneNumberId: '  ' })).phoneNumberId).toBe(
      'Phone number ID is required',
    );
    expect(errorsOf(false, valid({ phoneNumberId: '12ab5678' })).phoneNumberId).toBe(
      'Use the digits Meta shows as the Phone number ID',
    );
  });

  it('takes no display number, or one written as people dial it, up to 40 characters', () => {
    expect(errorsOf(false, valid({ displayPhone: '' }))).toEqual({});
    expect(errorsOf(false, valid({ displayPhone: 'call me' })).displayPhone).toBe(
      'Type the number as people dial it',
    );
    expect(errorsOf(false, valid({ displayPhone: '1'.repeat(41) })).displayPhone).toBe(
      'The number is too long',
    );
  });

  it('requires both credentials on a first connection', () => {
    const errors = errorsOf(false, valid({ accessToken: '', appSecret: ' ' }));
    expect(errors.accessToken).toBe('Access token is required');
    expect(errors.appSecret).toBe('App secret is required');
  });

  it('lets an edit leave both credentials blank to keep the stored ones', () => {
    expect(errorsOf(true, valid({ accessToken: '', appSecret: '' }))).toEqual({});
  });

  it.each([false, true])('rejects credentials that are too short (edit: %s)', (isEdit) => {
    const errors = errorsOf(
      isEdit,
      valid({ accessToken: credential(19), appSecret: credential(15) }),
    );
    expect(errors.accessToken).toBe('That access token is too short');
    expect(errors.appSecret).toBe('That app secret is too short');
  });

  it('keeps the verify token between 8 and 128 characters', () => {
    expect(errorsOf(false, valid({ verifyToken: 'short' })).verifyToken).toBe(
      'Use at least 8 characters',
    );
    expect(errorsOf(false, valid({ verifyToken: 'v'.repeat(129) })).verifyToken).toBe(
      'Use at most 128 characters',
    );
    expect(errorsOf(false, valid({ verifyToken: 'v'.repeat(128) }))).toEqual({});
  });
});

describe('toWhatsappNumberValues', () => {
  it('fills an existing number, never its credentials', () => {
    expect(toWhatsappNumberValues(channelRow({ enabled: false }))).toEqual({
      phoneNumberId: '1234567890',
      displayPhone: '+1 555 010 0000',
      accessToken: '',
      appSecret: '',
      verifyToken: 'verify-token-123',
      enabled: false,
    });
  });

  it('starts a new number switched on, with a fresh dash-free verify token', () => {
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(
      '0f8fad5b-d9cb-469f-a165-70867728950e',
    );
    expect(toWhatsappNumberValues(null)).toEqual({
      phoneNumberId: '',
      displayPhone: '',
      accessToken: '',
      appSecret: '',
      verifyToken: '0f8fad5bd9cb469fa16570867728950e',
      enabled: true,
    });
  });
});
