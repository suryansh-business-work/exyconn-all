import { describe, expect, it } from 'vitest';
import { toDemoProfile, toWorkflowDef } from '../../../src/author';
import { SEED_DEMOS } from '../../../src/seeds';
import { demoSchema, workflowSchema } from '../../../src/schema';

describe('SEED_DEMOS', () => {
  it('registers twenty industries with unique keys, in chat-list order', () => {
    const keys = SEED_DEMOS.map((d) => d.key);
    expect(keys).toHaveLength(20);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.slice(0, 2)).toEqual(['healthcare', 'salon']);
    expect(keys).toEqual(
      expect.arrayContaining(['automobile', 'clinic', 'coworking', 'education']),
    );
  });

  it('stores every industry as a valid profile with uniquely keyed workflows', () => {
    for (const [order, demo] of SEED_DEMOS.entries()) {
      expect(demoSchema.safeParse(toDemoProfile(demo, order)).success, demo.key).toBe(true);
      const workflowKeys = demo.workflows.map((w) => w.key);
      expect(new Set(workflowKeys).size, demo.key).toBe(workflowKeys.length);
      for (const [i, w] of demo.workflows.entries()) {
        expect(workflowSchema.safeParse(toWorkflowDef(w, i)).success, `${demo.key}/${w.key}`).toBe(
          true,
        );
      }
    }
  });
});
