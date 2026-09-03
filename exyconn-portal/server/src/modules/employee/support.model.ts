import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** Which team an employee support ticket is routed to. */
export const SUPPORT_CATEGORIES = ['IT', 'HR', 'PAYROLL', 'FACILITIES', 'OTHER'] as const;
/** Ticket urgency. */
export const SUPPORT_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;
/** Ticket lifecycle. */
export const SUPPORT_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;

/** A support request raised by an employee (self-service, keyed by `employeeId`). */
const supportTicketSchema = new Schema(
  {
    employeeId: { type: String, required: true, trim: true },
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
  },
  { timestamps: true },
);

export type SupportTicketDocument = InferSchemaType<typeof supportTicketSchema>;

export const SupportTicketModel: Model<SupportTicketDocument> = model<SupportTicketDocument>(
  'SupportTicket',
  supportTicketSchema,
);
