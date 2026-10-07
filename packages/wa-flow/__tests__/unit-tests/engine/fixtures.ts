/**
 * Shared builders for the engine tests: a deterministic context (fixed clock, identity
 * translation, formatters that show exactly what they were given) and tiny bundles.
 */
import { toWorkflowDef, type AuthorNode } from '../../../src/author';
import type { DemoProfile, WorkflowDef } from '../../../src/schema';
import type { DemoBundle, EngineContext } from '../../../src/engine/types';

/** Wednesday 7 October 2026, 09:00 UTC (TZ is pinned to UTC). */
export const NOW = Date.UTC(2026, 9, 7, 9, 0);

export function makeCtx(overrides: Partial<EngineContext> = {}): EngineContext {
  return {
    now: NOW,
    user: {
      firstName: 'Asha',
      fullName: 'Asha Rao',
      email: 'asha@example.com',
      phone: '+91 98765 43210',
    },
    t: (source) => source,
    format: {
      date: (ms) => `date:${ms}`,
      time: (ms) => `time:${ms}`,
      day: (ms) => `day:${ms}`,
      money: (rupees) => `Rs ${rupees}`,
    },
    ai: false,
    ...overrides,
  };
}

export function makeWorkflow(
  key: string,
  nodes: readonly AuthorNode[],
  extra: Partial<{ keywords: string[]; start: string; order: number }> = {},
): WorkflowDef {
  return toWorkflowDef(
    {
      key,
      name: `${key} name`,
      description: `${key} description`,
      keywords: extra.keywords ?? [],
      start: extra.start,
      nodes,
    },
    extra.order ?? 0,
  );
}

export const DEMO: DemoProfile = {
  key: 'demo',
  industry: 'Testing',
  business: {
    name: 'Test Co',
    tagline: 'Tests',
    category: 'Testing',
    about: 'A business for tests',
    icon: 'business',
    accent: 'teal',
    verified: true,
    phone: '+91 90000 00000',
    email: 'hello@test.example',
    website: 'https://test.example',
    address: '1 Test Road',
    hours: 'Always',
  },
  greeting: 'Hi {{user.firstName}}',
  menuText: 'Pick one',
  menuButton: 'Options',
  order: 0,
  active: true,
};

export function makeBundle(workflows: readonly WorkflowDef[]): DemoBundle {
  return { demo: DEMO, workflows };
}
