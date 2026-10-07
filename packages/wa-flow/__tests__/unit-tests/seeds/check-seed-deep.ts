/**
 * The checks for an industry whose branches depend on earlier answers, random picks or the
 * viewer's profile: valid shape, publishable graphs, and every customer step reached by the
 * stateful walk in `deep-explore.ts`.
 */
import { expect, it } from 'vitest';
import { toDemoProfile, toWorkflowDef, type SeedDemo } from '../../../src/author';
import { demoSchema, workflowSchema } from '../../../src/schema';
import { isPublishable, validateGraph } from '../../../src/validate';
import { deepWalk, MAX_EVENTS, type WalkOptions } from './deep-explore';
import { bundleOf, waitingNodes } from './harness';

/** The walk replays every branch, several thousand engine turns for the larger industries. */
const WALK_TIMEOUT_MS = 30_000;
const byName = (a: string, b: string) => a.localeCompare(b);

export function checkSeedDeep(
  seed: SeedDemo,
  keys: readonly string[],
  options: WalkOptions = { seeds: ['a'], followMenu: false },
): void {
  it('lists its workflows in menu order', () => {
    expect(seed.workflows.map((w) => w.key)).toEqual(keys);
  });

  it('stores as a valid demo profile and valid workflows', () => {
    expect(demoSchema.safeParse(toDemoProfile(seed, 0)).success).toBe(true);
    for (const [i, workflow] of seed.workflows.entries()) {
      const parsed = workflowSchema.safeParse(toWorkflowDef(workflow, i));
      expect(parsed.error?.issues ?? [], workflow.key).toEqual([]);
    }
  });

  it('has graphs that can be published, with every node reachable', () => {
    for (const workflow of bundleOf(seed).workflows) {
      const issues = validateGraph(workflow.graph, keys);
      expect(isPublishable(issues), workflow.key).toBe(true);
      expect(issues, workflow.key).toEqual([]);
    }
  });

  it(
    'plays every workflow to completion and reaches every customer step',
    () => {
      const bundle = bundleOf(seed);
      const walk = deepWalk(bundle, options);
      expect(walk.events).toBeLessThan(MAX_EVENTS);
      expect([...walk.completed].sort(byName)).toEqual([...keys].sort(byName));
      expect(waitingNodes(bundle).length).toBeGreaterThan(keys.length);
      expect(waitingNodes(bundle).filter((n) => !walk.reached.has(n))).toEqual([]);
      expect(walk.missingReplies).toBe(0);
    },
    WALK_TIMEOUT_MS,
  );
}
