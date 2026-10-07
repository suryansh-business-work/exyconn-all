import { describe, expect, it } from 'vitest';
import { isPublishable, validateGraph, type GraphIssue } from '../../src/validate';
import type { WaEdge, WaGraph, WaNode } from '../../src/schema';

const at = { x: 0, y: 0 };
const text = (id: string): WaNode => ({ id, type: 'text', position: at, data: { text: id } });
const end = (id: string): WaNode => ({ id, type: 'end', position: at, data: { showMenu: true } });
const edge = (source: string, target: string, sourceHandle = 'next'): WaEdge => ({
  id: `${source}-${sourceHandle}`,
  source,
  sourceHandle,
  target,
});
const graph = (nodes: WaNode[], edges: WaEdge[] = [], start = nodes[0].id): WaGraph => ({
  start,
  nodes,
  edges,
});
const messages = (issues: readonly GraphIssue[]) => issues.map((i) => i.message);

describe('validateGraph', () => {
  it('finds nothing wrong with a straight path to an End node', () => {
    const issues = validateGraph(graph([text('a'), end('b')], [edge('a', 'b')]));
    expect(issues).toEqual([]);
    expect(isPublishable(issues)).toBe(true);
  });

  it('reports shape problems with their path and stops there', () => {
    const issues = validateGraph({ start: 'a', nodes: [], edges: [] });
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ severity: 'error', message: '{path}: {problem}' });
    expect(issues[0].values?.path).toBe('nodes');
  });

  it('reports duplicate node ids', () => {
    const issues = validateGraph(graph([text('a'), end('a')], [edge('a', 'a')]));
    expect(issues).toContainEqual(
      expect.objectContaining({ nodeId: 'a', values: { id: 'a' }, severity: 'error' }),
    );
  });

  it('stops at a missing start node', () => {
    const issues = validateGraph(graph([end('a')], [], 'ghost'));
    expect(messages(issues)).toEqual(['The workflow has no start node.']);
    expect(isPublishable(issues)).toBe(false);
  });

  it('reports edges whose source or target does not exist', () => {
    const issues = validateGraph(
      graph([text('a'), end('b')], [edge('a', 'b'), edge('ghost', 'b'), edge('b', 'nowhere')]),
    );
    const broken = issues.filter((i) => i.message.includes('does not exist'));
    expect(broken.map((i) => i.values?.id)).toEqual(['ghost-next', 'b-next']);
  });

  it('reports an edge from an output the node does not have', () => {
    const issues = validateGraph(graph([text('a'), end('b')], [edge('a', 'b', 'yes')]));
    expect(issues).toContainEqual(
      expect.objectContaining({
        nodeId: 'a',
        message: 'Edge "{id}" leaves from an output this node does not have.',
      }),
    );
  });

  it('reports one output wired to two nodes', () => {
    const second = { ...edge('a', 'c'), id: 'a-next-2' };
    const issues = validateGraph(graph([text('a'), end('b'), end('c')], [edge('a', 'b'), second]));
    expect(messages(issues)).toContain('One output is connected to two nodes.');
  });

  it('reports unwired buttons, AI fallbacks and input answers but not plain next', () => {
    const buttons: WaNode = {
      id: 'q',
      type: 'buttons',
      position: at,
      data: {
        text: 'Pick',
        buttons: [
          { id: 'yes', title: 'Yes' },
          { id: 'no', title: 'No' },
        ],
      },
    };
    const ai: WaNode = {
      id: 'ai',
      type: 'ai',
      position: at,
      data: { intents: [{ id: 'book', description: 'Book' }], entities: [] },
    };
    const input: WaNode = {
      id: 'in',
      type: 'input',
      position: at,
      data: { var: 'v', kind: 'name' },
    };
    const issues = validateGraph(
      graph([buttons, ai, input, end('e')], [edge('q', 'ai', 'yes'), edge('q', 'in', 'no')]),
    );
    const unwired = issues.filter((i) => i.message === '"{label}" is not connected to anything.');
    expect(unwired.map((i) => `${i.nodeId}:${i.values?.label}`)).toEqual([
      'ai:Not understood',
      'in:Valid answer',
    ]);
    expect(issues.some((i) => i.nodeId === 'ai' && i.values?.label === 'book')).toBe(false);
  });

  it('warns about a message node the conversation stops at', () => {
    const issues = validateGraph(graph([text('a')]));
    expect(issues).toEqual([
      {
        severity: 'warning',
        nodeId: 'a',
        message: 'The conversation stops here. End it with an End node to offer the menu.',
      },
    ]);
    expect(isPublishable(issues)).toBe(true);
  });

  it('warns about nodes nothing leads to, even inside a loop', () => {
    const issues = validateGraph(
      graph([text('a'), text('b'), end('orphan')], [edge('a', 'b'), edge('b', 'a')]),
    );
    expect(issues).toEqual([
      { severity: 'warning', nodeId: 'orphan', message: 'Nothing leads to this node.' },
    ]);
  });

  it('checks jump targets only when workflow keys are given', () => {
    const jump = (key: string): WaNode => ({
      id: `j-${key}`,
      type: 'jump',
      position: at,
      data: { workflowKey: key },
    });
    const g = graph([text('a'), jump('known'), jump('lost')], [edge('a', 'j-known')]);
    expect(validateGraph(g).some((i) => i.message.includes('jump to'))).toBe(false);
    const issues = validateGraph(g, ['known']);
    const missing = issues.filter((i) => i.message === 'There is no workflow "{key}" to jump to.');
    expect(missing).toEqual([
      expect.objectContaining({ nodeId: 'j-lost', values: { key: 'lost' } }),
    ]);
  });
});

describe('isPublishable', () => {
  it('is blocked by any error and not by warnings', () => {
    expect(isPublishable([])).toBe(true);
    expect(isPublishable([{ severity: 'warning', message: 'w' }])).toBe(true);
    expect(
      isPublishable([
        { severity: 'warning', message: 'w' },
        { severity: 'error', message: 'e' },
      ]),
    ).toBe(false);
  });
});
