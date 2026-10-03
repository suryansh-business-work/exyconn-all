import { createHash } from 'node:crypto';
import type { Types } from 'mongoose';
import type { WhatsappDemoDocument, WhatsappWorkflowDocument } from './whatsappDemo.model';
import type {
  WhatsappDemoEventDocument,
  WhatsappDemoSessionDocument,
} from './whatsappDemo.analytics.model';

/** How a stored row reaches the API: ids as strings, dates as ISO. */

type Stored<T> = T & { _id: Types.ObjectId; createdAt?: Date; updatedAt?: Date };

/** A session with no event for this long reads as ended. */
export const SESSION_IDLE_MS = 30 * 60 * 1000;

const iso = (value: Date | null | undefined): string | null => (value ? value.toISOString() : null);

/** JSON with every object's keys sorted, so two equal graphs always serialise the same. */
function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const entries = Object.keys(value)
      .sort((a, b) => a.localeCompare(b))
      .map(
        (key) => `${JSON.stringify(key)}:${stableJson((value as Record<string, unknown>)[key])}`,
      );
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

export function sameGraph(a: unknown, b: unknown): boolean {
  return stableJson(a) === stableJson(b);
}

export function presentDemo(doc: Stored<WhatsappDemoDocument>) {
  return {
    id: String(doc._id),
    key: doc.key,
    industry: doc.industry,
    business: doc.business,
    greeting: doc.greeting,
    menuText: doc.menuText,
    menuButton: doc.menuButton,
    order: doc.order,
    active: doc.active,
    updatedAt: iso(doc.updatedAt) ?? new Date(0).toISOString(),
  };
}

export function workflowStatus(doc: WhatsappWorkflowDocument): 'DRAFT' | 'PUBLISHED' {
  if (doc.version > 0 && doc.published && sameGraph(doc.draft, doc.published)) {
    return 'PUBLISHED';
  }
  return 'DRAFT';
}

export function presentWorkflow(doc: Stored<WhatsappWorkflowDocument>) {
  return {
    id: String(doc._id),
    demoId: doc.demoId,
    demoKey: doc.demoKey,
    key: doc.key,
    name: doc.name,
    description: doc.description ?? '',
    keywords: doc.keywords ?? [],
    order: doc.order,
    status: workflowStatus(doc),
    version: doc.version,
    draft: doc.draft,
    published: doc.published ?? null,
    publishedAt: iso(doc.publishedAt),
    updatedAt: iso(doc.updatedAt) ?? new Date(0).toISOString(),
    updatedByName: doc.updatedByName ?? null,
  };
}

export function presentPublished(doc: Stored<WhatsappWorkflowDocument>) {
  return {
    key: doc.key,
    name: doc.name,
    description: doc.description ?? '',
    keywords: doc.keywords ?? [],
    order: doc.order,
    version: doc.version,
    graph: doc.published,
  };
}

/**
 * A fingerprint of everything the chat runs for one demo: the demo's last edit and every
 * published workflow's version. Any publish, discard of a live workflow, delete or demo
 * edit changes it, so the chat can tell its cached copy is stale.
 */
export function bundleRevision(
  demo: Stored<WhatsappDemoDocument>,
  workflows: readonly Stored<WhatsappWorkflowDocument>[],
): string {
  const parts = workflows.map((wf) => `${wf.key}@${wf.version}`);
  const seed = [iso(demo.updatedAt) ?? '', ...parts].join('|');
  return createHash('sha1').update(seed).digest('hex').slice(0, 16);
}

export function presentSession(doc: Stored<WhatsappDemoSessionDocument>, now = Date.now()) {
  return {
    id: String(doc._id),
    sessionId: doc.sessionId,
    userId: doc.userId,
    userName: doc.userName ?? '',
    userEmail: doc.userEmail ?? '',
    startedAt: doc.startedAt.toISOString(),
    lastEventAt: doc.lastEventAt.toISOString(),
    durationMs: doc.durationMs ?? 0,
    device: doc.device ?? null,
    viewport: doc.viewport ?? null,
    demos: doc.demos ?? [],
    flowsStarted: doc.flowsStarted ?? 0,
    flowsCompleted: doc.flowsCompleted ?? 0,
    events: doc.events ?? 0,
    status: now - doc.lastEventAt.getTime() <= SESSION_IDLE_MS ? 'active' : 'ended',
  };
}

export function presentEvent(doc: Stored<WhatsappDemoEventDocument>) {
  return {
    id: doc.eventId,
    type: doc.type,
    at: doc.at.toISOString(),
    demoKey: doc.demoKey ?? null,
    workflow: doc.workflow ?? null,
    node: doc.node ?? null,
    stepKind: doc.stepKind ?? null,
    label: doc.label ?? null,
    durationMs: doc.durationMs ?? null,
    meta: doc.meta ?? null,
  };
}
