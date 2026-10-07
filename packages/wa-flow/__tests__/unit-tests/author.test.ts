import { describe, expect, it } from 'vitest';
import {
  defineDemo,
  defineWorkflow,
  toDemoProfile,
  toWorkflowDef,
  type SeedWorkflow,
} from '../../src/author';
import { LAYOUT_GAP } from '../../src/layout';
import { DEMO } from './engine/fixtures';

const seed: SeedWorkflow = {
  key: 'book',
  name: 'Book',
  description: 'Book a visit',
  keywords: ['book', 'visit'],
  nodes: [
    {
      id: 'ask',
      type: 'buttons',
      data: {
        text: 'When?',
        buttons: [
          { id: 'am', title: 'Morning' },
          { id: 'pm', title: 'Evening' },
        ],
      },
      next: { am: 'done', pm: 'note' },
    },
    { id: 'note', type: 'text', data: { text: 'Evenings are busy' }, next: 'done' },
    { id: 'done', type: 'end', data: { showMenu: true } },
  ],
};

describe('toWorkflowDef', () => {
  it('turns inline next into edges named source--handle', () => {
    const def = toWorkflowDef(seed, 3);
    expect(def.graph.edges).toEqual([
      { id: 'ask--am', source: 'ask', sourceHandle: 'am', target: 'done' },
      { id: 'ask--pm', source: 'ask', sourceHandle: 'pm', target: 'note' },
      { id: 'note--next', source: 'note', sourceHandle: 'next', target: 'done' },
    ]);
    expect(def).toMatchObject({ key: 'book', name: 'Book', order: 3 });
  });

  it('starts at the first node unless a start is given', () => {
    expect(toWorkflowDef(seed, 0).graph.start).toBe('ask');
    expect(toWorkflowDef({ ...seed, start: 'note' }, 0).graph.start).toBe('note');
  });

  it('copies keywords and lays the nodes out by depth', () => {
    const def = toWorkflowDef(seed, 0);
    expect(def.keywords).toEqual(['book', 'visit']);
    expect(def.keywords).not.toBe(seed.keywords);
    const position = Object.fromEntries(def.graph.nodes.map((n) => [n.id, n.position]));
    expect(position.ask).toEqual({ x: 0, y: 0 });
    expect(position.note).toEqual({ x: LAYOUT_GAP.x, y: 0 });
    expect(position.done).toEqual({ x: LAYOUT_GAP.x, y: LAYOUT_GAP.y });
  });
});

describe('toDemoProfile', () => {
  it('keeps the profile fields, adds the order and makes it active', () => {
    const demo = defineDemo({
      key: DEMO.key,
      industry: DEMO.industry,
      business: DEMO.business,
      greeting: DEMO.greeting,
      menuText: DEMO.menuText,
      menuButton: DEMO.menuButton,
      workflows: [defineWorkflow(seed)],
    });
    expect(toDemoProfile(demo, 5)).toEqual({ ...DEMO, order: 5, active: true });
  });

  it('returns definitions unchanged', () => {
    expect(defineWorkflow(seed)).toBe(seed);
  });
});
