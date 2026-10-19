import { describe, expect, it } from 'vitest';
import { CrmSmsProvider } from '@exyconn/shell/graphql/generated';
import {
  makeCrmSmsConfigSchema,
  toCrmSmsConfigInput,
  toCrmSmsConfigValues,
  type CrmSmsConfigValues,
} from '../../../../../../src/pages/integrations/forms/crm-sms-config';
import { smsConfigRow, TWILIO_SID } from '../../integration-fixtures';

const twilio: CrmSmsConfigValues = {
  label: 'Sales texts',
  provider: CrmSmsProvider.Twilio,
  fromNumber: '+14155550100',
  accountId: TWILIO_SID,
  authToken: 'secret',
  senderId: '',
  templateId: '',
  messageVariable: '',
  isActive: 'true',
};

const msg91: CrmSmsConfigValues = {
  ...twilio,
  provider: CrmSmsProvider.Msg91,
  fromNumber: '',
  accountId: '',
  senderId: 'EXYCON',
  templateId: 'flow-1',
  messageVariable: 'message',
};

function messages(values: object, isEdit = false) {
  const result = makeCrmSmsConfigSchema(isEdit).safeParse(values);
  return Object.fromEntries((result.error?.issues ?? []).map((i) => [i.path[0], i.message]));
}

describe('makeCrmSmsConfigSchema', () => {
  it('checks only the Twilio fields for a Twilio account', () => {
    expect(messages(twilio)).toEqual({});
    expect(messages({ ...twilio, accountId: 'AC1', fromNumber: '0123' })).toEqual({
      accountId: 'A Twilio Account SID starts with AC, then 32 letters and digits',
      fromNumber: 'Enter the number in international format, e.g. +14155550100',
    });
  });

  it('checks only the DLT fields for an MSG91 account', () => {
    expect(messages(msg91)).toEqual({});
    expect(messages({ ...msg91, senderId: 'EX', templateId: '', messageVariable: '1x' })).toEqual({
      senderId: 'Enter the DLT sender id, e.g. EXYCON',
      templateId: 'Enter the MSG91 flow template id',
      messageVariable: 'Enter the template variable that carries the message, e.g. message',
    });
  });

  it('wants a name and, on create only, a token', () => {
    expect(messages({ ...twilio, label: '', authToken: '' })).toEqual({
      label: 'Give it a name',
      authToken: 'Enter the auth token or key',
    });
    expect(messages({ ...twilio, authToken: '' }, true)).toEqual({});
    expect(messages({ ...twilio, label: 'a'.repeat(81) })).toEqual({
      label: 'Keep the name under 80 characters',
    });
  });
});

describe('toCrmSmsConfigValues', () => {
  it('starts a new account as an active Twilio one with the default variable', () => {
    expect(toCrmSmsConfigValues(null)).toEqual({
      label: '',
      provider: CrmSmsProvider.Twilio,
      fromNumber: '',
      accountId: '',
      authToken: '',
      senderId: '',
      templateId: '',
      messageVariable: 'message',
      isActive: 'true',
    });
  });

  it('loads a stored MSG91 account, keeping its own variable name', () => {
    const row = smsConfigRow({
      provider: CrmSmsProvider.Msg91,
      senderId: 'EXYCON',
      templateId: 'flow-1',
      messageVariable: 'body',
      isActive: false,
    });

    expect(toCrmSmsConfigValues(row)).toMatchObject({
      provider: CrmSmsProvider.Msg91,
      senderId: 'EXYCON',
      templateId: 'flow-1',
      messageVariable: 'body',
      isActive: 'false',
      authToken: '',
    });
  });

  it('falls back to the default variable when a stored one is blank', () => {
    expect(toCrmSmsConfigValues(smsConfigRow()).messageVariable).toBe('message');
  });
});

describe('toCrmSmsConfigInput', () => {
  it('sends only the Twilio fields for Twilio', () => {
    expect(toCrmSmsConfigInput(twilio)).toEqual({
      label: 'Sales texts',
      provider: CrmSmsProvider.Twilio,
      authToken: 'secret',
      isActive: true,
      fromNumber: '+14155550100',
      accountId: TWILIO_SID,
    });
  });

  it('sends only the DLT fields for MSG91', () => {
    expect(toCrmSmsConfigInput({ ...msg91, isActive: 'false' })).toEqual({
      label: 'Sales texts',
      provider: CrmSmsProvider.Msg91,
      authToken: 'secret',
      isActive: false,
      senderId: 'EXYCON',
      templateId: 'flow-1',
      messageVariable: 'message',
    });
  });
});
