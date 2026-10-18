import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

export const CALL_PROVIDERS = ['TWILIO', 'VOBIZ'] as const;
export const SMS_PROVIDERS = ['TWILIO', 'MSG91'] as const;
export type CallProvider = (typeof CALL_PROVIDERS)[number];
export type SmsProvider = (typeof SMS_PROVIDERS)[number];

/** How long a Vobiz call bridge waits for the agent to answer before its session is gone. */
const CALL_SESSION_TTL_SECONDS = 10 * 60;

/**
 * The company's own calling account for click-to-call from the CRM (CRM > Integrations).
 * Company data: each organisation brings its own Twilio or Vobiz account. Exactly one row is
 * `isActive`. `authToken` is sealed (utils/secretBox) and never returned; `authTokenHint`
 * keeps its last characters so two tokens can be told apart.
 */
const crmCallConfigSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    provider: { type: String, enum: CALL_PROVIDERS, required: true },
    /** The number the company calls from, in E.164. */
    fromNumber: { type: String, required: true, trim: true },
    /** Twilio's Account SID or Vobiz's Auth ID. */
    accountId: { type: String, required: true, trim: true },
    authToken: { type: String, required: true },
    authTokenHint: { type: String, default: null },
    isActive: { type: Boolean, required: true, default: false },
    updatedByName: { type: String, default: '' },
  },
  { timestamps: true },
);

/**
 * The company's own SMS account (CRM > Integrations), one `isActive`. Twilio sends from
 * `fromNumber` with `accountId` + `authToken`; MSG91 sends a DLT-approved flow template
 * (`templateId`, `senderId`) whose `messageVariable` carries the text, with `authToken` as
 * its auth key. Secrets sealed as for calls.
 */
const crmSmsConfigSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    provider: { type: String, enum: SMS_PROVIDERS, required: true },
    fromNumber: { type: String, default: '', trim: true },
    accountId: { type: String, default: '', trim: true },
    authToken: { type: String, required: true },
    authTokenHint: { type: String, default: null },
    senderId: { type: String, default: '', trim: true },
    templateId: { type: String, default: '', trim: true },
    messageVariable: { type: String, default: '', trim: true },
    isActive: { type: Boolean, required: true, default: false },
    updatedByName: { type: String, default: '' },
  },
  { timestamps: true },
);

/**
 * One Vobiz click-to-call bridge waiting for the agent to answer. Vobiz fetches its answer XML
 * from a URL carrying only the random `token`; the contact's number stays here, read once and
 * deleted, and the row expires on its own if the agent never answers.
 */
const crmCallSessionSchema = new Schema({
  token: { type: String, required: true, unique: true },
  /** The number the bridge dials once the agent answers (digits, as Vobiz takes them). */
  dial: { type: String, required: true },
  callerId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: CALL_SESSION_TTL_SECONDS },
});

export type CrmCallConfigDocument = InferSchemaType<typeof crmCallConfigSchema>;
export type CrmSmsConfigDocument = InferSchemaType<typeof crmSmsConfigSchema>;
export type CrmCallSessionDocument = InferSchemaType<typeof crmCallSessionSchema>;

export const CrmCallConfigModel: Model<CrmCallConfigDocument> = model<CrmCallConfigDocument>(
  'CrmCallConfig',
  crmCallConfigSchema,
);
export const CrmSmsConfigModel: Model<CrmSmsConfigDocument> = model<CrmSmsConfigDocument>(
  'CrmSmsConfig',
  crmSmsConfigSchema,
);
export const CrmCallSessionModel: Model<CrmCallSessionDocument> = model<CrmCallSessionDocument>(
  'CrmCallSession',
  crmCallSessionSchema,
);
