import {
  buildFixPrompt,
  buildOpenErrorsPrompt,
  type PromptEvent,
  type PromptGroup,
} from '../../../../src/modules/logs/logs.prompt';
import { SOURCE_CODE_HINTS } from '../../../../src/modules/logs/logs.constants';

const AT = new Date('2026-09-11T10:00:00.000Z');

function group(overrides: Partial<PromptGroup> = {}): PromptGroup {
  return {
    source: 'DESKTOP',
    app: 'tracker-desktop',
    level: 'ERROR',
    status: 'OPEN',
    errorName: 'RangeError',
    message: 'Invalid time value',
    stack: 'RangeError: Invalid time value\n    at group (main.js:1:1)',
    route: '/today',
    count: 4,
    userCount: 2,
    firstSeenAt: AT,
    lastSeenAt: AT,
    ...overrides,
  };
}

function event(overrides: Partial<PromptEvent> = {}): PromptEvent {
  return {
    occurredAt: AT,
    level: 'ERROR',
    message: 'Invalid time value',
    stack: 'RangeError: Invalid time value\n    at event (renderer.js:2:2)',
    componentStack: '',
    route: '/today',
    context: '',
    count: 1,
    breadcrumbs: [],
    userName: 'Asha',
    userEmail: 'asha@exyconn.com',
    userVerified: true,
    platform: 'darwin',
    osVersion: '15.1',
    deviceModel: 'MacBook',
    appVersion: '1.9.8',
    ...overrides,
  };
}

const crumb = (index: number) => ({
  at: new Date(AT.getTime() + index * 1000),
  level: 'INFO',
  message: `step ${index}`,
});

describe('buildFixPrompt', () => {
  it('describes the group and points at where the code lives', () => {
    const prompt = buildFixPrompt(group(), [event()]);

    expect(prompt).toContain('# Fix: RangeError: Invalid time value');
    expect(prompt).toContain(
      '- Source: DESKTOP · app `tracker-desktop` · level ERROR · status OPEN',
    );
    expect(prompt).toContain('- Seen 4 times by 2 people, first 2026-09-11T10:00:00.000Z');
    expect(prompt).toContain(SOURCE_CODE_HINTS.DESKTOP);
    expect(prompt).toContain(
      '- Latest occurrence: version 1.9.8 on darwin 15.1 MacBook, route `/today`',
    );
    expect(prompt).toContain('at event (renderer.js:2:2)');
    expect(prompt).not.toContain('at group (main.js:1:1)');
    expect(prompt).toContain('## What to do');
  });

  it('adds the component stack, breadcrumbs and context only when the occurrence has them', () => {
    const bare = buildFixPrompt(group(), [event()]);
    const full = buildFixPrompt(group(), [
      event({
        componentStack: 'at <Timeline>',
        breadcrumbs: [crumb(1)],
        context: '{"day":"2026-09-11"}',
      }),
    ]);

    expect(bare).not.toContain('## React component stack');
    expect(bare).not.toContain('## What happened just before');
    expect(bare).not.toContain('## Context');
    expect(full).toContain('## React component stack\n\n```\nat <Timeline>\n```');
    expect(full).toContain('- 2026-09-11T10:00:01.000Z INFO step 1');
    expect(full).toContain('## Context\n\n```json\n{"day":"2026-09-11"}\n```');
  });

  it('falls back to the group’s stack and route, and to "unknown" when neither knows', () => {
    const fromGroup = buildFixPrompt(group(), [
      event({ stack: '', route: '', appVersion: '', platform: '', osVersion: '', deviceModel: '' }),
    ]);
    const unknown = buildFixPrompt(group({ route: '' }), [event({ route: '' })]);

    expect(fromGroup).toContain('at group (main.js:1:1)');
    expect(fromGroup).toContain('version unknown on unknown device, route `/today`');
    expect(unknown).toContain('route `unknown`');
  });

  it('titles a group with no error name by its message, and names an unknown source as is', () => {
    const prompt = buildFixPrompt(group({ errorName: '', source: 'WATCH' }), []);

    expect(prompt).toContain('# Fix: Invalid time value');
    expect(prompt).toContain('- Where the code lives: WATCH');
    expect(prompt).not.toContain('Latest occurrence');
  });

  it('writes each occurrence as a safe table row', () => {
    const rows = buildFixPrompt(group(), [
      event({ route: '/a|b\n/c', userVerified: false, appVersion: '' }),
      event({ userName: '', userEmail: 'ravi@exyconn.com', count: 7 }),
      event({ userName: '', userEmail: '' }),
    ]);

    expect(rows).toContain(
      '| 2026-09-11T10:00:00.000Z | Asha (unverified) | — | darwin 15.1 MacBook | /a\\|b /c | 1 |',
    );
    expect(rows).toContain('| ravi@exyconn.com | 1.9.8 |');
    expect(rows).toContain('| 7 |');
    expect(rows).toContain('| anonymous | 1.9.8 |');
  });
});

describe('buildOpenErrorsPrompt', () => {
  it('says so when there is nothing open', () => {
    expect(buildOpenErrorsPrompt([])).toBe(
      '# No open errors\n\nThere are no OPEN error logs right now.',
    );
  });

  it('numbers each group and cuts its stack and breadcrumbs to the essentials', () => {
    const longStack = Array.from({ length: 30 }, (_, index) => `frame ${index + 1}`).join('\n');
    const crumbs = Array.from({ length: 12 }, (_, index) => crumb(index + 1));

    const prompt = buildOpenErrorsPrompt([
      {
        group: group(),
        latest: event({ stack: longStack, breadcrumbs: crumbs, context: '{"a":1}' }),
      },
      { group: group({ errorName: '', message: 'Silent failure', stack: '' }), latest: undefined },
    ]);

    expect(prompt).toContain('# Fix these 2 open errors');
    expect(prompt).toContain('## 1. RangeError: Invalid time value');
    expect(prompt).toContain('frame 25\n```');
    expect(prompt).not.toContain('frame 26');
    expect(prompt).toContain('Just before:\n- 2026-09-11T10:00:03.000Z INFO step 3');
    expect(prompt).not.toContain('step 2\n');
    expect(prompt).toContain('```json\n{"a":1}\n```');
    expect(prompt).toContain('## 2. Silent failure');
    expect(prompt).toContain('No stack was captured.');
  });

  it('uses the group’s stack when the latest occurrence has none, and leaves out empty extras', () => {
    const prompt = buildOpenErrorsPrompt([{ group: group(), latest: event({ stack: '' }) }]);

    expect(prompt).toContain('at group (main.js:1:1)');
    expect(prompt).not.toContain('Just before:');
    expect(prompt).not.toContain('```json');
  });
});
