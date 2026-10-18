import { RhfTextField } from '@exyconn/shell/components/form/rhf';

/** Twilio sends from one of its numbers on the account. */
export function TwilioSmsFields() {
  return (
    <>
      <RhfTextField
        name="accountId"
        label="Account SID"
        helperText="Twilio console > Account info: starts with AC"
      />
      <RhfTextField
        name="fromNumber"
        label="From number"
        inputMode="tel"
        helperText="An SMS-capable number on this account, in international format, e.g. +14155550100"
      />
    </>
  );
}

/**
 * MSG91 (India) only delivers DLT-registered messages: a sender id and a flow template approved
 * on the DLT portal, with one variable the CRM fills with the typed message.
 */
export function Msg91SmsFields() {
  return (
    <>
      <RhfTextField
        name="senderId"
        label="Sender ID"
        helperText="The DLT-approved header people see, e.g. EXYCON"
      />
      <RhfTextField
        name="templateId"
        label="Template ID"
        helperText="MSG91 > Flows: the flow built on your DLT-approved template. Indian operators drop any SMS that does not match an approved template."
      />
      <RhfTextField
        name="messageVariable"
        label="Template variable name"
        helperText="The variable in that template that carries the message, e.g. message for ##message##. Approve the template with this variable as its whole body so any text fits."
      />
    </>
  );
}
