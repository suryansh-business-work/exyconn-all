import { SOURCE_CODE_HINTS, type AppLogSource } from './logs.constants';

/** The fields of a stored group the prompt reads. */
export interface PromptGroup {
  source: string;
  app: string;
  level: string;
  status: string;
  errorName: string;
  message: string;
  stack: string;
  route: string;
  count: number;
  userCount: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
}

/** The fields of a stored occurrence the prompt reads. */
export interface PromptEvent {
  occurredAt: Date;
  level: string;
  message: string;
  stack: string;
  componentStack: string;
  route: string;
  context: string;
  count: number;
  breadcrumbs: Array<{ at: Date; level: string; message: string }>;
  userName: string;
  userEmail: string;
  userVerified: boolean;
  platform: string;
  osVersion: string;
  deviceModel: string;
  appVersion: string;
}

const FENCE = '```';
/** In the all-open-errors prompt each group's stack is cut to its top frames. */
const SHORT_STACK_LINES = 25;
const SHORT_BREADCRUMBS = 10;

const iso = (value: Date) => new Date(value).toISOString();

function fenced(text: string, lang = ''): string {
  return [FENCE + lang, text, FENCE].join('\n');
}

/** A table cell: no newlines or pipes, and a dash rather than nothing. */
function cell(value: string): string {
  const flat = value
    .replaceAll(/\s+/g, ' ')
    .replaceAll('|', String.raw`\|`)
    .trim();
  return flat || '—';
}

function who(event: PromptEvent): string {
  const name = event.userName || event.userEmail || 'anonymous';
  return event.userVerified ? name : `${name} (unverified)`;
}

function device(event: PromptEvent): string {
  return [event.platform, event.osVersion, event.deviceModel].filter(Boolean).join(' ');
}

function title(group: PromptGroup): string {
  return group.errorName ? `${group.errorName}: ${group.message}` : group.message;
}

function summaryLines(group: PromptGroup, latest: PromptEvent | undefined): string[] {
  const lines = [
    `- Source: ${group.source} · app \`${group.app}\` · level ${group.level} · status ${group.status}`,
    `- Seen ${group.count} times by ${group.userCount} people, first ${iso(group.firstSeenAt)}, last ${iso(group.lastSeenAt)} (UTC)`,
    `- Where the code lives: ${SOURCE_CODE_HINTS[group.source as AppLogSource] ?? group.source}`,
  ];
  if (latest) {
    const at = latest.route || group.route || 'unknown';
    lines.push(
      `- Latest occurrence: version ${latest.appVersion || 'unknown'} on ${device(latest) || 'unknown device'}, route \`${at}\``,
    );
  }
  return lines;
}

function breadcrumbLines(event: PromptEvent, limit?: number): string[] {
  const crumbs = limit === undefined ? event.breadcrumbs : event.breadcrumbs.slice(-limit);
  return crumbs.map((crumb) => `- ${iso(crumb.at)} ${crumb.level} ${cell(crumb.message)}`);
}

function occurrenceTable(events: PromptEvent[]): string[] {
  return [
    '| When (UTC) | User | Version | Device | Route | Times |',
    '| --- | --- | --- | --- | --- | --- |',
    ...events.map(
      (event) =>
        `| ${iso(event.occurredAt)} | ${cell(who(event))} | ${cell(event.appVersion)} | ${cell(device(event))} | ${cell(event.route)} | ${event.count} |`,
    ),
  ];
}

const TASK_LINES = [
  '## What to do',
  '1. Find the root cause in this repository. Release stacks can be minified — use the route, the component stack and the breadcrumbs to find the code.',
  '2. Fix it at the cause; do not just catch and hide the error.',
  "3. Add a regression test next to the package's existing tests.",
  "4. Run that package's typecheck, lint and tests.",
];

/** Optional sections, each only when the occurrence carries it. */
function detailSections(latest: PromptEvent): string[] {
  const sections: string[] = [];
  if (latest.componentStack) {
    sections.push('## React component stack', fenced(latest.componentStack));
  }
  if (latest.breadcrumbs.length > 0) {
    sections.push(
      '## What happened just before (oldest first)',
      breadcrumbLines(latest).join('\n'),
    );
  }
  if (latest.context) {
    sections.push('## Context', fenced(latest.context, 'json'));
  }
  return sections;
}

/** Everything known about one group, as Markdown to paste into Claude. */
export function buildFixPrompt(group: PromptGroup, events: PromptEvent[]): string {
  const latest = events[0];
  const stack = latest?.stack || group.stack;
  return [
    `# Fix: ${title(group)}`,
    summaryLines(group, latest).join('\n'),
    '## Stack (latest occurrence)',
    stack ? fenced(stack) : 'No stack was captured.',
    ...(latest ? detailSections(latest) : []),
    '## Recent occurrences',
    occurrenceTable(events).join('\n'),
    TASK_LINES.join('\n'),
  ].join('\n\n');
}

function shortSection(index: number, group: PromptGroup, latest: PromptEvent | undefined): string {
  const stack = (latest?.stack || group.stack).split('\n').slice(0, SHORT_STACK_LINES).join('\n');
  const crumbs = latest ? breadcrumbLines(latest, SHORT_BREADCRUMBS) : [];
  const context = latest?.context ? [fenced(latest.context, 'json')] : [];
  return [
    `## ${index + 1}. ${title(group)}`,
    summaryLines(group, latest).join('\n'),
    stack ? fenced(stack) : 'No stack was captured.',
    ...context,
    ...(crumbs.length > 0 ? [['Just before:', ...crumbs].join('\n')] : []),
  ].join('\n\n');
}

/** Every open error in one prompt, most recent first, each cut to its essentials. */
export function buildOpenErrorsPrompt(
  groups: Array<{ group: PromptGroup; latest: PromptEvent | undefined }>,
): string {
  if (groups.length === 0) {
    return '# No open errors\n\nThere are no OPEN error logs right now.';
  }
  return [
    `# Fix these ${groups.length} open errors`,
    'Work through them in order. Several may share one root cause — fix the cause once.',
    ...groups.map(({ group, latest }, index) => shortSection(index, group, latest)),
    TASK_LINES.join('\n'),
  ].join('\n\n');
}
