import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import {
  IT_INCIDENT_CATEGORIES,
  IT_INCIDENT_SEVERITIES,
  IT_INCIDENT_STATUSES,
} from '../itsm.enums';

/** One entry on an incident's timeline, written as it happens and never edited. */
const timelineEntrySchema = new Schema(
  {
    at: { type: Date, required: true, default: Date.now },
    status: { type: String, enum: IT_INCIDENT_STATUSES, required: true },
    note: { type: String, required: true, trim: true },
    authorName: { type: String, default: '', trim: true },
  },
  { _id: true },
);

/** Something the post-incident review decided must be done so it does not happen again. */
const followUpSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    ownerName: { type: String, default: '', trim: true },
    dueAt: { type: Date, default: null },
    done: { type: Boolean, required: true, default: false },
  },
  { _id: true },
);

/**
 * An internal IT incident: an outage, a breach, a failure that needs someone in charge, a
 * timeline and — once it is over — a root cause and follow-up actions.
 *
 * Deliberately not the Status portal's incident, which is the PUBLIC record of a monitored
 * service being down. A root cause and its follow-ups are internal and must never reach the
 * public page.
 */
const incidentSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    severity: { type: String, enum: IT_INCIDENT_SEVERITIES, required: true, default: 'SEV3' },
    category: { type: String, enum: IT_INCIDENT_CATEGORIES, required: true, default: 'OUTAGE' },
    status: { type: String, enum: IT_INCIDENT_STATUSES, required: true, default: 'INVESTIGATING' },
    startedAt: { type: Date, required: true },
    resolvedAt: { type: Date, default: null },
    /** Who and what was affected, in words. */
    impact: { type: String, default: '', trim: true },
    affectedSystems: { type: [String], default: [] },
    commanderName: { type: String, default: '', trim: true },
    timeline: { type: [timelineEntrySchema], default: [] },
    rootCause: { type: String, default: '', trim: true },
    followUps: { type: [followUpSchema], default: [] },
  },
  { timestamps: true },
);

export type ItIncidentDocument = InferSchemaType<typeof incidentSchema>;
export const ItIncidentModel: Model<ItIncidentDocument> = model<ItIncidentDocument>(
  'ItIncident',
  incidentSchema,
);
