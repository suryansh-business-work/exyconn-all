import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

export const AUDIT_ACTIONS = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'ROLE_CHANGE',
  'PASSWORD_RESET',
  'SETTINGS',
  'PERMISSION',
  'ACCESS',
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

/**
 * One row per thing somebody changed. Append-only: nothing in the server ever updates or
 * deletes one, which is what makes the log worth reading when a change is disputed.
 */
const auditLogSchema = new Schema(
  {
    actorId: { type: String, default: '' },
    actorName: { type: String, default: '' },
    actorEmail: { type: String, default: '' },
    action: { type: String, enum: AUDIT_ACTIONS, required: true },
    /** The CRUD module's singular name ("Invoice") or a hand-written area ("User", "Auth"). */
    module: { type: String, required: true, trim: true },
    entityId: { type: String, default: '' },
    /** A human name for the row — name, number, title, subject or email, whichever it has. */
    entityLabel: { type: String, default: '' },
    summary: { type: String, required: true },
    /** JSON string of `{ field: { from, to } }`, only on updates. */
    changes: { type: String, default: '' },
    ip: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ module: 1, entityId: 1 });

export type AuditLogDocument = InferSchemaType<typeof auditLogSchema>;

export const AuditLogModel: Model<AuditLogDocument> = model<AuditLogDocument>(
  'AuditLog',
  auditLogSchema,
);
