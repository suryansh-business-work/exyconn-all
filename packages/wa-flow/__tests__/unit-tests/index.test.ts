import { describe, expect, it } from 'vitest';
import * as waFlow from '../../src';
import { toWorkflowDef } from '../../src/author';
import { toDemoBundle } from '../../src/catalog';
import { outputHandles } from '../../src/handles';
import { autoLayout } from '../../src/layout';
import { graphSchema } from '../../src/schema';
import { validateGraph } from '../../src/validate';
import { ACCENT_KEYS, ICON_KEYS } from '../../src/visuals';

describe('@exyconn/wa-flow entry', () => {
  it('re-exports the schema, validator, layout, catalogue and authoring helpers', () => {
    expect(waFlow.toWorkflowDef).toBe(toWorkflowDef);
    expect(waFlow.toDemoBundle).toBe(toDemoBundle);
    expect(waFlow.outputHandles).toBe(outputHandles);
    expect(waFlow.autoLayout).toBe(autoLayout);
    expect(waFlow.graphSchema).toBe(graphSchema);
    expect(waFlow.validateGraph).toBe(validateGraph);
    expect(waFlow.ICON_KEYS).toBe(ICON_KEYS);
  });

  it('stays server-safe: the conversation engine is a separate entry', () => {
    expect(Object.keys(waFlow)).not.toContain('respond');
    expect(Object.keys(waFlow)).not.toContain('newChatState');
  });

  it('authors, stores and validates a workflow through the one entry', () => {
    const def = waFlow.toWorkflowDef(
      {
        key: 'hello',
        name: 'Hello',
        description: 'Says hello',
        keywords: ['hello'],
        nodes: [
          { id: 'hi', type: 'text', data: { text: 'Hello' }, next: 'bye' },
          { id: 'bye', type: 'end', data: { showMenu: true } },
        ],
      },
      0,
    );
    expect(waFlow.workflowSchema.safeParse(def).success).toBe(true);
    const issues = waFlow.validateGraph(def.graph, ['hello']);
    expect(issues).toEqual([]);
    expect(waFlow.isPublishable(issues)).toBe(true);
  });
});

describe('visual keys', () => {
  it('names every icon and accent once, and the schema accepts each of them', () => {
    expect(new Set(ICON_KEYS).size).toBe(ICON_KEYS.length);
    expect(new Set(ACCENT_KEYS).size).toBe(ACCENT_KEYS.length);
    expect(ICON_KEYS.every((icon) => waFlow.iconSchema.safeParse(icon).success)).toBe(true);
    expect(ACCENT_KEYS.every((accent) => waFlow.accentSchema.safeParse(accent).success)).toBe(true);
  });

  it('refuses a name the screens have no icon or colour for', () => {
    expect(waFlow.iconSchema.safeParse('unicorn').success).toBe(false);
    expect(waFlow.accentSchema.safeParse('neon').success).toBe(false);
  });
});
