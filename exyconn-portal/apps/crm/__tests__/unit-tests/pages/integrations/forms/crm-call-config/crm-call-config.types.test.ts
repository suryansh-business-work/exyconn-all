import { describe, expect, it } from 'vitest';
import { CrmCallProvider } from '@exyconn/shell/graphql/generated';
import {
  accountLabel,
  makeCrmCallConfigSchema,
  toCrmCallConfigInput,
  toCrmCallConfigValues,
} from '../../../../../../src/pages/integrations/forms/crm-call-config';
import { callConfigRow, TWILIO_SID } from '../../integration-fixtures';

const valid = {
  label: 'Sales line',
  provider: CrmCallProvider.Twilio,
  fromNumber: '+14155550100',
  accountId: TWILIO_SID,
  authToken: 'secret',
  isActive: 'true' as const,
};

function messages(values: object, isEdit = false) {
  const result = makeCrmCallConfigSchema(isEdit).safeParse(values);
  return Object.fromEntries((result.error?.issues ?? []).map((i) => [i.path[0], i.message]));
}

describe('accountLabel', () => {
  it('names the account id the way each provider does', () => {
    expect(accountLabel(CrmCallProvider.Twilio)).toBe('Account SID');
    expect(accountLabel(CrmCallProvider.Vobiz)).toBe('Auth ID');
  });
});

describe('makeCrmCallConfigSchema', () => {
  it('accepts a complete Twilio account', () => {
    expect(messages(valid)).toEqual({});
  });

  it('wants a name, an E.164 number and a token on create', () => {
    expect(messages({ ...valid, label: ' ', fromNumber: '4155550100', authToken: '' })).toEqual({
      label: 'Give it a name',
      fromNumber: 'Enter the number in international format, e.g. +14155550100',
      authToken: 'Enter the auth token',
    });
  });

  it('caps the name at 80 characters', () => {
    expect(messages({ ...valid, label: 'a'.repeat(81) })).toEqual({
      label: 'Keep the name under 80 characters',
    });
  });

  it('checks a Twilio SID and a Vobiz auth id against their own patterns', () => {
    expect(messages({ ...valid, accountId: 'AC123' })).toEqual({
      accountId: 'A Twilio Account SID starts with AC, then 32 letters and digits',
    });
    expect(messages({ ...valid, provider: CrmCallProvider.Vobiz, accountId: 'MA_1234' })).toEqual(
      {},
    );
    expect(messages({ ...valid, provider: CrmCallProvider.Vobiz, accountId: 'ab' })).toEqual({
      accountId: 'Enter the Vobiz Auth ID',
    });
  });

  it('keeps the stored token when an edit leaves it blank', () => {
    expect(messages({ ...valid, authToken: '' }, true)).toEqual({});
  });
});

describe('toCrmCallConfigValues', () => {
  it('starts a new account as an active Twilio one', () => {
    expect(toCrmCallConfigValues(null)).toEqual({
      label: '',
      provider: CrmCallProvider.Twilio,
      fromNumber: '',
      accountId: '',
      authToken: '',
      isActive: 'true',
    });
  });

  it('loads a stored account without its token', () => {
    expect(
      toCrmCallConfigValues(callConfigRow({ provider: CrmCallProvider.Vobiz, isActive: false })),
    ).toEqual({
      label: 'Sales line',
      provider: CrmCallProvider.Vobiz,
      fromNumber: '+14155550100',
      accountId: TWILIO_SID,
      authToken: '',
      isActive: 'false',
    });
  });
});

describe('toCrmCallConfigInput', () => {
  it('turns the active choice back into a boolean', () => {
    expect(toCrmCallConfigInput({ ...valid, isActive: 'false' })).toEqual({
      label: 'Sales line',
      provider: CrmCallProvider.Twilio,
      fromNumber: '+14155550100',
      accountId: TWILIO_SID,
      authToken: 'secret',
      isActive: false,
    });
    expect(toCrmCallConfigInput(valid).isActive).toBe(true);
  });
});
