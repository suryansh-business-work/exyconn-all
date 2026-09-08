import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import {
  INCIDENT_IMPACTS,
  INCIDENT_SOURCES,
  INCIDENT_UPDATE_STATUSES,
  STATUS_STATES,
} from './status.constants';

/** One entry in an incident's timeline, oldest first as stored. */
const incidentUpdateSchema = new Schema(
  {
    status: { type: String, enum: INCIDENT_UPDATE_STATUSES, required: true },
    body: { type: String, default: '', trim: true },
    authorName: { type: String, default: '', trim: true },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  { _id: true },
);

/**
 * A stretch during which something was not right. Opened either by the probe loop
 * (the first failing streak) or by a person from Tech > Incidents, and told through
 * its `updates` — the public status page shows them newest first.
 */
const statusIncidentSchema = new Schema(
  {
    /** The service the incident is filed under; the first affected one when several are. */
    serviceKey: { type: String, required: true, trim: true },
    serviceName: { type: String, required: true, trim: true },
    /** Empty on rows written before titles existed; the overview derives one from the service. */
    title: { type: String, default: '', trim: true },
    source: { type: String, enum: INCIDENT_SOURCES, required: true, default: 'MONITOR' },
    impact: { type: String, enum: INCIDENT_IMPACTS, required: true, default: 'MAJOR' },
    affectedServiceKeys: { type: [String], default: [] },
    state: { type: String, enum: STATUS_STATES, required: true, default: 'DOWN' },
    reason: { type: String, default: '', trim: true },
    updates: { type: [incidentUpdateSchema], default: [] },
    startedAt: { type: Date, required: true },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

statusIncidentSchema.index({ serviceKey: 1, resolvedAt: 1 });
statusIncidentSchema.index({ startedAt: -1 });

export type StatusIncidentDocument = InferSchemaType<typeof statusIncidentSchema>;
export type StatusIncidentUpdate = StatusIncidentDocument['updates'][number];
export const StatusIncidentModel: Model<StatusIncidentDocument> = model<StatusIncidentDocument>(
  'StatusIncident',
  statusIncidentSchema,
);
