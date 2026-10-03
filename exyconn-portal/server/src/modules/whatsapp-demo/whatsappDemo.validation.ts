import { GraphQLError } from 'graphql';
import type { ZodError } from 'zod';
import type { GraphIssue } from '@exyconn/wa-flow';

/** Mongo's duplicate-key error code: a unique index refused the write. */
const DUPLICATE_KEY = 11000;

export function isDuplicateKey(error: unknown): boolean {
  return (error as { code?: number } | null)?.code === DUPLICATE_KEY;
}

/** One readable line per problem, shown to the admin as-is. */
export interface InputIssue {
  path: string;
  message: string;
  nodeId?: string;
}

function refuse(summary: string, issues: InputIssue[]): never {
  const detail = issues.map((issue) =>
    issue.path ? `${issue.path}: ${issue.message}` : issue.message,
  );
  throw new GraphQLError([summary, ...detail.slice(0, 10)].join('\n'), {
    extensions: { code: 'BAD_USER_INPUT', issues },
  });
}

/** Refuses input that failed a Zod schema, listing every issue with its path. */
export function refuseZod(summary: string, error: ZodError): never {
  refuse(
    summary,
    error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
  );
}

/** A validator issue with its `{placeholders}` filled in. */
function issueText(issue: GraphIssue): string {
  return Object.entries(issue.values ?? {}).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, value),
    issue.message,
  );
}

/** Refuses a publish whose graph has errors; warnings never block it. */
export function refuseGraph(issues: readonly GraphIssue[]): never {
  refuse(
    'This workflow cannot be published until these are fixed.',
    issues
      .filter((issue) => issue.severity === 'error')
      .map((issue) => ({
        path: issue.nodeId ?? '',
        message: issueText(issue),
        nodeId: issue.nodeId,
      })),
  );
}
