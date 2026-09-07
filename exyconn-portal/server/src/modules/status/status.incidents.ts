import { StatusIncidentModel } from './status-incident.model';
import { StatusMonitorModel } from './status-monitor.model';
import { announceIncident } from './status.alerts';
import { badRequest, notFound } from '../../utils/errors';
import type { IncidentImpact, IncidentUpdateStatus } from './status.constants';

/** What Tech fills in to open an incident by hand. */
export interface CreateIncidentInput {
  title: string;
  impact: IncidentImpact;
  affectedServiceKeys: string[];
  /** The first timeline entry, posted as INVESTIGATING. */
  body: string;
}

/** Active monitors matching the keys, in catalogue order; unknown keys are dropped. */
async function affectedMonitors(keys: string[]) {
  return StatusMonitorModel.find({ key: { $in: keys }, isActive: true })
    .sort({ order: 1 })
    .select('key name url')
    .lean();
}

/**
 * Opens an incident a person noticed before (or instead of) the probe loop. It is filed
 * under the first affected service so the same queries the monitor's incidents use find
 * it, and starts with an INVESTIGATING update carrying the author's words.
 */
export async function createStatusIncident(input: CreateIncidentInput, authorName: string) {
  const title = input.title.trim();
  if (!title) {
    badRequest('Give the incident a title');
  }
  const monitors = await affectedMonitors(input.affectedServiceKeys);
  if (monitors.length === 0) {
    badRequest('Choose at least one affected service');
  }
  const at = new Date();
  const incident = await StatusIncidentModel.create({
    serviceKey: monitors[0].key,
    serviceName: monitors[0].name,
    title,
    source: 'MANUAL',
    impact: input.impact,
    affectedServiceKeys: monitors.map((monitor) => monitor.key),
    state: input.impact === 'MINOR' ? 'DEGRADED' : 'DOWN',
    reason: input.body.trim(),
    updates: [{ status: 'INVESTIGATING', body: input.body.trim(), authorName, createdAt: at }],
    startedAt: at,
  });
  return incident.toObject();
}

/**
 * Appends one timeline entry. RESOLVED also closes the incident and tells the team the
 * same way the probe loop does when a service comes back.
 */
export async function addStatusIncidentUpdate(
  id: string,
  status: IncidentUpdateStatus,
  body: string,
  authorName: string,
) {
  const incident = await StatusIncidentModel.findById(id);
  if (!incident) {
    notFound('Incident');
  }
  if (incident.resolvedAt) {
    badRequest('This incident is already resolved');
  }
  const at = new Date();
  incident.updates.push({ status, body: body.trim(), authorName, createdAt: at });
  if (status === 'RESOLVED') {
    incident.resolvedAt = at;
  }
  await incident.save();

  if (status === 'RESOLVED') {
    const monitor = await StatusMonitorModel.findOne({ key: incident.serviceKey })
      .select('url')
      .lean();
    await announceIncident(
      'RESOLVED',
      { key: incident.serviceKey, name: incident.serviceName, url: monitor?.url ?? '' },
      body.trim(),
    );
  }
  return incident.toObject();
}
