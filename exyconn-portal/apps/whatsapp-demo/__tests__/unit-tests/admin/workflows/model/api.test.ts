import { describe, expect, it } from 'vitest';
import {
  DEMO_PARAM,
  DEMO_QUERIES,
  WORKFLOWS_PATH,
  WORKFLOW_QUERIES,
  asGraph,
  editorPath,
  listPath,
  toDemoProfile,
  toWorkflowDef,
} from '../../../../../src/admin/workflows/model/api';
import { SAMPLE_GRAPH, demoRow, workflowRow } from '../../admin.fixtures';

describe('workflow paths', () => {
  it("links to a workflow's editor under the list path", () => {
    expect(editorPath('wf-9')).toBe(`${WORKFLOWS_PATH}/wf-9`);
  });

  it('keeps the chosen demo in the list URL, encoded', () => {
    expect(listPath('demo 1&x')).toBe(`${WORKFLOWS_PATH}?${DEMO_PARAM}=demo%201%26x`);
  });

  it('is the bare list path without a demo', () => {
    expect(listPath()).toBe(WORKFLOWS_PATH);
    expect(listPath('')).toBe(WORKFLOWS_PATH);
  });

  it('refreshes the chat catalog after both workflow and demo changes', () => {
    expect(WORKFLOW_QUERIES).toContain('WhatsappDemoCatalog');
    expect(DEMO_QUERIES).toContain('WhatsappDemoCatalog');
  });
});

describe('row conversions', () => {
  it('passes a stored graph through unchanged', () => {
    expect(asGraph(SAMPLE_GRAPH)).toBe(SAMPLE_GRAPH);
  });

  it('turns a demo row into the profile the chat engine reads, without server fields', () => {
    const profile = toDemoProfile(demoRow({ order: 4, active: false }));
    expect(profile).toEqual({
      key: 'clinic',
      industry: 'Healthcare',
      business: { name: 'City Clinic' },
      greeting: 'Welcome',
      menuText: 'Pick one',
      menuButton: 'Menu',
      order: 4,
      active: false,
    });
    expect(profile).not.toHaveProperty('id');
    expect(profile).not.toHaveProperty('updatedAt');
  });

  it('turns a workflow row into a definition running the given graph', () => {
    const row = workflowRow({ keywords: ['book', 'visit'] });
    const def = toWorkflowDef(row, SAMPLE_GRAPH);
    expect(def).toEqual({
      key: 'book-visit',
      name: 'Book a visit',
      description: 'Books an appointment',
      keywords: ['book', 'visit'],
      order: 2,
      graph: SAMPLE_GRAPH,
    });
    expect(def.keywords).not.toBe(row.keywords);
  });
});
