import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { attachmentSchema } from '../support/attachment.schema';

/** Which team an employee support ticket is routed to. */
export const SUPPORT_CATEGORIES = ['IT', 'HR', 'PAYROLL', 'FACILITIES', 'OTHER'] as const;
/** Ticket urgency. */
export const SUPPORT_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;
/** Ticket lifecycle. */
export const SUPPORT_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;
/** Who raised it: somebody who works here, or a customer off the public form. */
export const SUPPORT_REQUESTERS = ['EMPLOYEE', 'CLIENT'] as const;
/** How it reached the desk: a portal form, the support mailbox, or an agent typing it in. */
export const SUPPORT_CHANNELS = ['PORTAL', 'EMAIL', 'AGENT'] as const;
/** Mirrors the GraphQL `TicketChannel` enum. */
export type TicketChannel = (typeof SUPPORT_CHANNELS)[number];
/** The statuses that count as "the ticket is done". */
export const SUPPORT_CLOSED_STATUSES: ReadonlySet<string> = new Set(['RESOLVED', 'CLOSED']);

/**
 * A support request. Two kinds share this collection, told apart by `requesterType`:
 * an employee ticket (keyed by `employeeId`) and a customer ticket raised through the
 * public form (keyed by `requesterEmail`, with `clientId` filled in when the address
 * matches a client on file). They share one queue because the support team works one
 * queue — splitting the storage would only mean two of every console.
 */
const supportTicketSchema = new Schema(
  {
    /** Empty on a customer ticket — nobody here raised it. */
    employeeId: { type: String, default: '', trim: true },
    requesterType: { type: String, enum: SUPPORT_REQUESTERS, required: true, default: 'EMPLOYEE' },
    /** How it arrived. PORTAL is the default because every ticket used to come that way. */
    channel: { type: String, enum: SUPPORT_CHANNELS, required: true, default: 'PORTAL' },
    /** Quotable handle (`EXY-4KQ7W2`) so a ticket can be followed without an account. */
    reference: { type: String, default: '', trim: true, index: true },
    /** Set only when the requester's address matched a client on file. */
    clientId: { type: String, default: '', trim: true },
    clientName: { type: String, default: '', trim: true },
    /** Who to write back to on a customer ticket. Empty on an employee ticket. */
    requesterName: { type: String, default: '', trim: true },
    requesterEmail: { type: String, default: '', trim: true, lowercase: true },
    subject: { type: String, required: true, trim: true },
    category: { type: String, enum: SUPPORT_CATEGORIES, required: true, default: 'OTHER' },
    description: { type: String, required: true, trim: true },
    priority: { type: String, enum: SUPPORT_PRIORITIES, required: true, default: 'MEDIUM' },
    status: { type: String, enum: SUPPORT_STATUSES, required: true, default: 'OPEN' },
    /**
     * Who on the support team owns it. Empty means nobody has picked it up, which
     * is the queue the console leads with. The name is stored with the id so a
     * ticket row reads without joining the user collection.
     */
    assigneeId: { type: String, default: '', trim: true },
    assigneeName: { type: String, default: '', trim: true },
    /** Files posted with the original request. */
    attachments: { type: [attachmentSchema], default: [] },
    /**
     * SLA clocks. `dueAt` is stamped from the policy for the ticket's priority when it is
     * raised and recomputed when the priority changes; the other two are stamped by what
     * actually happened, so the state is derived rather than stored and cannot drift.
     */
    dueAt: { type: Date, default: null },
    firstRespondedAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type SupportTicketDocument = InferSchemaType<typeof supportTicketSchema>;

export const SupportTicketModel: Model<SupportTicketDocument> = model<SupportTicketDocument>(
  'SupportTicket',
  supportTicketSchema,
);
