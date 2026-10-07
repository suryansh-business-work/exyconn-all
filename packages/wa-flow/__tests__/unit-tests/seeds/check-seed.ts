/** The checks every seed industry must pass: valid shape, publishable graphs, playable end to end. */
import { expect, it } from 'vitest';
import { toDemoProfile, toWorkflowDef, type SeedDemo } from '../../../src/author';
import { demoSchema, workflowSchema } from '../../../src/schema';
import { isPublishable, validateGraph } from '../../../src/validate';
import { bundleOf, explore, waitingNodes } from './harness';

export function checkSeed(seed: SeedDemo, keys: readonly string[]): void {
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

  it('plays every workflow to completion and reaches every customer step', () => {
    const bundle = bundleOf(seed);
    const seen = explore(bundle);
    expect([...seen.started].sort((a, b) => a.localeCompare(b))).toEqual(
      [...keys].sort((a, b) => a.localeCompare(b)),
    );
    expect([...seen.completed].sort((a, b) => a.localeCompare(b))).toEqual(
      [...keys].sort((a, b) => a.localeCompare(b)),
    );
    expect(waitingNodes(bundle).length).toBeGreaterThan(keys.length);
    expect(waitingNodes(bundle).filter((n) => !seen.reached.has(n))).toEqual([]);
    expect(seen.missingReplies).toBe(0);
  });
}
