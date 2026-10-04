import { z } from 'zod';
import { WhatsappChannelModel } from './channel.model';
import { channelLookup } from './channel.lookup';
import type { Sender } from './channel.graph';
import { refuseZod } from '../whatsappDemo.validation';
import { recordAudit } from '../../audit';
import { secretHint } from '../../tech/tech.secrets';
import { actorNameOf } from '../../../lib/actor';
import { badRequest, notFound } from '../../../utils/errors';
import { seal, open } from '../../../utils/secretBox';
import { env } from '../../../config/env';
import type { GraphQLContext } from '../../../middleware/auth';

/**
 * The admin side of the real WhatsApp number: what WhatsApp demo > Admin > WhatsApp number
 * reads and saves. The access token and app secret are write-only — a screen learns that one
 * is stored and its last characters, never the value — so a blank one on save keeps the stored
 * one. Every save and removal goes to the audit log.
 */
const MODULE = 'WhatsappChannel';
export const WEBHOOK_PATH = '/webhooks/whatsapp';

const isDigits = (value: string) => value !== '' && [...value].every((c) => c >= '0' && c <= '9');

const inputSchema = z.object({
  phoneNumberId: z
    .string()
    .trim()
    .min(5)
    .max(30)
    .refine(isDigits, 'Use the digits Meta shows as the Phone number ID.'),
  displayPhone: z.string().trim().max(40),
  accessToken: z.string().trim().max(2048),
  appSecret: z.string().trim().max(256),
  verifyToken: z.string().trim().min(8).max(128),
  enabled: z.boolean(),
});

export type WhatsappChannelInput = z.infer<typeof inputSchema>;

type Stored = NonNullable<Awaited<ReturnType<typeof findOwn>>>;

const findOwn = () => WhatsappChannelModel.findOne().lean();

function present(doc: Stored) {
  return {
    id: String(doc._id),
    phoneNumberId: doc.phoneNumberId,
    displayPhone: doc.displayPhone ?? '',
    verifyToken: doc.verifyToken,
    enabled: doc.enabled,
    hasAccessToken: doc.accessToken !== '',
    accessTokenHint: secretHint(open(doc.accessToken)),
    hasAppSecret: doc.appSecret !== '',
    webhookUrl: `${env.apiPublicUrl}${WEBHOOK_PATH}`,
    updatedAt: doc.updatedAt?.toISOString() ?? null,
    updatedByName: doc.updatedByName ?? null,
  };
}

/** What the admin screen shows before anything is saved: where Meta has to point. */
export async function getChannel() {
  const doc = await findOwn();
  return { webhookUrl: `${env.apiPublicUrl}${WEBHOOK_PATH}`, channel: doc ? present(doc) : null };
}

/** A secret from the form, sealed — or the stored one when the form left it blank. */
function secretFrom(value: string, stored: string | undefined, label: string): string {
  if (value !== '') {
    return seal(value);
  }
  if (!stored) {
    badRequest(`${label} is required.`);
  }
  return stored;
}

export async function saveChannel(ctx: GraphQLContext, raw: WhatsappChannelInput) {
  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) {
    refuseZod('The WhatsApp number settings are not valid.', parsed.error);
  }
  const input = parsed.data;
  const before = await findOwn();
  if (
    await channelLookup.numberTakenElsewhere(
      input.phoneNumberId,
      before ? String(before._id) : null,
    )
  ) {
    badRequest('This Phone number ID is already connected to another company.');
  }
  const values = {
    ...input,
    accessToken: secretFrom(input.accessToken, before?.accessToken, 'An access token'),
    appSecret: secretFrom(input.appSecret, before?.appSecret, 'The app secret'),
    updatedByName: await actorNameOf(ctx),
  };
  const doc = before
    ? await WhatsappChannelModel.findByIdAndUpdate(before._id, values, { new: true }).lean()
    : (await WhatsappChannelModel.create(values)).toObject();
  if (!doc) {
    notFound('WhatsApp number');
  }
  await recordAudit(ctx, {
    action: before ? 'UPDATE' : 'CREATE',
    module: MODULE,
    entityId: doc._id,
    entityLabel: input.displayPhone || input.phoneNumberId,
    summary: `${before ? 'Updated' : 'Connected'} the WhatsApp number ${input.displayPhone || input.phoneNumberId} (${input.enabled ? 'on' : 'off'})`,
  });
  return present(doc);
}

export async function deleteChannel(ctx: GraphQLContext) {
  const doc = await WhatsappChannelModel.findOneAndDelete().lean();
  if (!doc) {
    notFound('WhatsApp number');
  }
  await recordAudit(ctx, {
    action: 'DELETE',
    module: MODULE,
    entityId: doc._id,
    entityLabel: doc.displayPhone || doc.phoneNumberId,
    summary: `Disconnected the WhatsApp number ${doc.displayPhone || doc.phoneNumberId}`,
  });
  return true;
}

/** The company's number when it is switched on, ready to send from. */
export async function activeSender(): Promise<Sender | null> {
  const doc = await WhatsappChannelModel.findOne({ enabled: true }).lean();
  return doc ? { phoneNumberId: doc.phoneNumberId, accessToken: open(doc.accessToken) } : null;
}
