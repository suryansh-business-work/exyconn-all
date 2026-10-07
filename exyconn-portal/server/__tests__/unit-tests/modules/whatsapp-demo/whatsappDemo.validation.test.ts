import { GraphQLError } from 'graphql';
import { z } from 'zod';
import type { GraphIssue } from '@exyconn/wa-flow';
import {
  isDuplicateKey,
  refuseGraph,
  refuseZod,
} from '../../../../src/modules/whatsapp-demo/whatsappDemo.validation';

/** The GraphQLError a refusal throws. */
function caught(refusal: () => never): GraphQLError {
  try {
    refusal();
  } catch (error) {
    if (error instanceof GraphQLError) {
      return error;
    }
    throw error;
  }
  throw new Error('expected a refusal');
}

describe('a duplicate-key error', () => {
  it("is Mongo's code 11000", () => {
    expect(isDuplicateKey({ code: 11000 })).toBe(true);
  });

  it('is nothing else', () => {
    expect(isDuplicateKey({ code: 121 })).toBe(false);
    expect(isDuplicateKey(new Error('boom'))).toBe(false);
    expect(isDuplicateKey(null)).toBe(false);
    expect(isDuplicateKey(undefined)).toBe(false);
  });
});

describe('refusing input that failed a Zod schema', () => {
  const schema = z.object({ key: z.string().min(2), nested: z.object({ order: z.number() }) });

  it('lists every issue with its path as bad user input', () => {
    const parsed = schema.safeParse({ key: 'a', nested: { order: 'x' } });
    if (parsed.success) {
      throw new Error('expected the schema to fail');
    }
    const error = caught(() => refuseZod('The demo is not valid.', parsed.error));
    const lines = error.message.split('\n');
    expect(lines[0]).toBe('The demo is not valid.');
    expect(lines.slice(1).some((line) => line.startsWith('key: '))).toBe(true);
    expect(lines.slice(1).some((line) => line.startsWith('nested.order: '))).toBe(true);
    expect(error.extensions.code).toBe('BAD_USER_INPUT');
    expect(error.extensions.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: 'nested.order' })]),
    );
  });

  it('shows a root-level issue without a path prefix', () => {
    const parsed = z.string().safeParse(5);
    if (parsed.success) {
      throw new Error('expected the schema to fail');
    }
    const error = caught(() => refuseZod('Not valid.', parsed.error));
    const [summary, detail] = error.message.split('\n');
    expect(summary).toBe('Not valid.');
    expect(detail).toBe(parsed.error.issues[0].message);
  });
});

describe('refusing a graph that cannot be published', () => {
  it('lists only the errors, with their placeholders filled in', () => {
    const issues: GraphIssue[] = [
      {
        severity: 'error',
        nodeId: 'jump-1',
        message: 'There is no workflow "{key}" to jump to.',
        values: { key: 'billing' },
      },
      { severity: 'warning', nodeId: 'text-1', message: 'Nothing leads to this node.' },
      { severity: 'error', message: 'The workflow has no start node.' },
    ];
    const error = caught(() => refuseGraph(issues));
    expect(error.message.split('\n')).toEqual([
      'This workflow cannot be published until these are fixed.',
      'jump-1: There is no workflow "billing" to jump to.',
      'The workflow has no start node.',
    ]);
    expect(error.extensions.issues).toEqual([
      { path: 'jump-1', message: 'There is no workflow "billing" to jump to.', nodeId: 'jump-1' },
      { path: '', message: 'The workflow has no start node.', nodeId: undefined },
    ]);
  });

  it('shows at most ten problems in the message but returns them all', () => {
    const issues: GraphIssue[] = Array.from({ length: 12 }, (_, n) => ({
      severity: 'error',
      nodeId: `node-${n}`,
      message: 'Two nodes share the id "{id}".',
      values: { id: `node-${n}` },
    }));
    const error = caught(() => refuseGraph(issues));
    expect(error.message.split('\n')).toHaveLength(11);
    expect(error.extensions.issues).toHaveLength(12);
  });
});
