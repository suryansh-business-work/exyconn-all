import { Schema, model, type HydratedDocument, type InferSchemaType, type Model } from 'mongoose';

/**
 * The events a webhook can subscribe to.
 *
 * A fixed list, not free text: a subscription to an event nobody emits is a webhook that
 * silently never fires, and the person who set it up has no way to tell that from "nothing
 * has happened yet".
 */
export const WEBHOOK_EVENTS = [
  'invoice.created',
  'invoice.paid',
  'lead.created',
  'deal.won',
  'ticket.created',
  'purchase_order.received',
] as const;

/** Where a delivery has got to. PENDING and FAILED are both retried; DEAD is given up on. */
export const WEBHOOK_DELIVERY_STATUSES = ['PENDING', 'DELIVERED', 'FAILED', 'DEAD'] as const;

const webhookSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    events: { type: [String], required: true, default: [] },
    /**
     * The shared secret every delivery is signed with.
     *
     * Stored in clear, unavoidably: a signature has to be reproducible, so this is the one
     * credential here that cannot be a hash. It is shown once on creation and never listed
     * again, so it does not sit on a screen somebody screenshares.
     */
    secret: { type: String, required: true },
    active: { type: Boolean, required: true, default: true },
    createdBy: { type: String, default: '', trim: true },
    lastDeliveredAt: { type: Date, default: null },
    /** Consecutive failures. Reset by a success; used to disable an endpoint that is gone. */
    failureCount: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

/**
 * One attempt to deliver one event to one endpoint.
 *
 * Rows rather than fire-and-forget, because the question after an integration breaks is
 * always "did you send it, and what did they say" — and a log line that has rotated away
 * cannot answer it.
 */
const webhookDeliverySchema = new Schema(
  {
    webhookId: { type: String, required: true, trim: true, index: true },
    event: { type: String, required: true, trim: true },
    /** The exact bytes that were signed and sent, so a signature dispute is settleable. */
    payload: { type: String, required: true },
    status: {
      type: String,
      enum: WEBHOOK_DELIVERY_STATUSES,
      required: true,
      default: 'PENDING',
    },
    attempts: { type: Number, required: true, default: 0 },
    responseStatus: { type: Number, default: null },
    error: { type: String, default: '', trim: true },
    /** When the next attempt is due. The claim that stops two workers sending it twice. */
    nextAttemptAt: { type: Date, required: true, default: Date.now, index: true },
    deliveredAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];
export type WebhookDocument = InferSchemaType<typeof webhookSchema>;
export type WebhookDeliveryDocument = InferSchemaType<typeof webhookDeliverySchema>;
/** The delivery as Mongoose hands it back — the shape above, plus `_id`. */
export type WebhookDeliveryDoc = HydratedDocument<WebhookDeliveryDocument>;

export const WebhookModel: Model<WebhookDocument> = model<WebhookDocument>(
  'Webhook',
  webhookSchema,
);
export const WebhookDeliveryModel: Model<WebhookDeliveryDocument> = model<WebhookDeliveryDocument>(
  'WebhookDelivery',
  webhookDeliverySchema,
);
