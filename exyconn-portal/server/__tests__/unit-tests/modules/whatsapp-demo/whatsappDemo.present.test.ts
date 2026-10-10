import { Types } from 'mongoose';
import {
  bundleRevision,
  presentDemo,
  presentPublished,
  presentWorkflow,
  sameGraph,
  workflowStatus,
} from '../../../../src/modules/whatsapp-demo/whatsappDemo.present';

type DemoRow = Parameters<typeof presentDemo>[0];
type WorkflowRow = Parameters<typeof presentWorkflow>[0];

const UPDATED = new Date('2026-10-01T10:00:00.000Z');
const graph = { start: 'end', nodes: [{ id: 'end', type: 'end' }], edges: [] };

const demo = (fields: Partial<DemoRow> = {}): DemoRow => ({
  _id: new Types.ObjectId(),
  key: 'salon',
  industry: 'Salon',
  business: { name: 'Glow' },
  greeting: 'Hi',
  menuText: 'Pick one',
  menuButton: 'Menu',
  order: 2,
  active: true,
  createdAt: UPDATED,
  updatedAt: UPDATED,
  ...fields,
});

const workflow = (fields: Partial<WorkflowRow> = {}): WorkflowRow => ({
  _id: new Types.ObjectId(),
  demoId: 'demo-1',
  demoKey: 'salon',
  key: 'booking',
  name: 'Book',
  description: 'Book a slot',
  keywords: ['book'],
  order: 0,
  draft: graph,
  published: graph,
  version: 2,
  publishedAt: UPDATED,
  updatedById: 'u-1',
  updatedByName: 'Asha',
  createdAt: UPDATED,
  updatedAt: UPDATED,
  ...fields,
});

describe('comparing two graphs', () => {
  it('ignores the order of object keys', () => {
    expect(
      sameGraph({ a: 1, b: { c: [1, { d: 2, e: 3 }] } }, { b: { c: [1, { e: 3, d: 2 }] }, a: 1 }),
    ).toBe(true);
  });

  it('notices a changed value or array order', () => {
    expect(sameGraph({ a: [1, 2] }, { a: [2, 1] })).toBe(false);
    expect(sameGraph({ a: 'x' }, { a: 'y' })).toBe(false);
  });

  it('treats a missing graph as null', () => {
    expect(sameGraph(undefined, null)).toBe(true);
    expect(sameGraph({ a: undefined }, { a: null })).toBe(true);
  });
});

describe('a demo as the API shows it', () => {
  it('carries its fields with the id as a string and the date as ISO', () => {
    const row = demo();
    expect(presentDemo(row)).toEqual({
      id: row._id.toHexString(),
      key: 'salon',
      industry: 'Salon',
      business: { name: 'Glow' },
      greeting: 'Hi',
      menuText: 'Pick one',
      menuButton: 'Menu',
      order: 2,
      active: true,
      updatedAt: UPDATED.toISOString(),
    });
  });

  it('reads as edited at the epoch when it has no timestamp', () => {
    expect(presentDemo(demo({ updatedAt: undefined })).updatedAt).toBe(new Date(0).toISOString());
  });
});

describe('a workflow status', () => {
  it('is PUBLISHED when the draft is what is live', () => {
    expect(workflowStatus(workflow())).toBe('PUBLISHED');
  });

  it('is DRAFT before the first publish', () => {
    expect(workflowStatus(workflow({ version: 0, published: null }))).toBe('DRAFT');
  });

  it('is DRAFT when the draft has moved on from what is live', () => {
    expect(workflowStatus(workflow({ draft: { ...graph, start: 'other' } }))).toBe('DRAFT');
  });

  it('is DRAFT when a version is recorded but nothing is live', () => {
    expect(workflowStatus(workflow({ published: null }))).toBe('DRAFT');
  });
});

describe('a workflow as the API shows it', () => {
  it('carries both graphs, the status and ISO dates', () => {
    const row = workflow();
    expect(presentWorkflow(row)).toMatchObject({
      id: row._id.toHexString(),
      demoKey: 'salon',
      key: 'booking',
      status: 'PUBLISHED',
      version: 2,
      publishedAt: UPDATED.toISOString(),
      updatedAt: UPDATED.toISOString(),
      updatedByName: 'Asha',
      keywords: ['book'],
    });
  });

  it('fills what an old row lacks', () => {
    const presented = presentWorkflow(
      workflow({
        description: undefined,
        keywords: undefined,
        published: undefined,
        publishedAt: null,
        updatedAt: undefined,
        updatedByName: undefined,
        version: 0,
      }),
    );
    expect(presented).toMatchObject({
      description: '',
      keywords: [],
      published: null,
      publishedAt: null,
      updatedAt: new Date(0).toISOString(),
      updatedByName: null,
      status: 'DRAFT',
    });
  });

  it('shows the chat only the published graph', () => {
    const live = { ...graph, start: 'live' };
    expect(presentPublished(workflow({ published: live, draft: graph }))).toEqual({
      key: 'booking',
      name: 'Book',
      description: 'Book a slot',
      keywords: ['book'],
      order: 0,
      version: 2,
      graph: live,
    });
    expect(
      presentPublished(workflow({ description: undefined, keywords: undefined })),
    ).toMatchObject({
      description: '',
      keywords: [],
    });
  });
});

describe("a demo bundle's revision", () => {
  it('is the same for the same demo and versions', () => {
    const row = demo();
    const flows = [workflow()];
    expect(bundleRevision(row, flows)).toBe(bundleRevision(row, flows));
    expect(bundleRevision(row, flows)).toMatch(/^[0-9a-f]{16}$/);
  });

  it('changes on a publish, a delete or a demo edit', () => {
    const row = demo();
    const base = bundleRevision(row, [workflow()]);
    expect(bundleRevision(row, [workflow({ version: 3 })])).not.toBe(base);
    expect(bundleRevision(row, [])).not.toBe(base);
    expect(
      bundleRevision(demo({ updatedAt: new Date('2026-10-02T00:00:00Z') }), [workflow()]),
    ).not.toBe(base);
    expect(bundleRevision(demo({ updatedAt: undefined }), [workflow()])).not.toBe(base);
  });
});
