import { BugModel } from './bugs.model';
import { assigneeNameFor, projectNameFor, promoteBugToTask, type BugNames } from './bugs.promote';
import { actorOf, serializeTask } from '../projects/board.resolvers';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { assertPermission } from '../../lib/permissions';
import { ROLES } from '../../constants/roles';
import type { GraphQLContext } from '../../middleware/auth';
import { toAttachments, type Attachment, type AttachmentInput } from '../../lib/attachments';

interface BugInput extends Partial<BugNames> {
  title: string;
  description: string;
  stepsToReproduce?: string | null;
  publicLink?: string | null;
  privateLink?: string | null;
  attachments?: AttachmentInput[] | null;
  severity: string;
  status: string;
  projectId?: string | null;
  assigneeId?: string | null;
  dueDate?: Date | null;
}

/** A stored bug, as `.lean()` returns it — older rows lack the fields added since. */
interface BugRow {
  projectName?: string | null;
  assigneeId?: string | null;
  assigneeName?: string | null;
  assignee?: string | null;
  taskKey?: string | null;
  stepsToReproduce?: string | null;
  publicLink?: string | null;
  privateLink?: string | null;
  attachments?: Attachment[] | null;
}

const BUG_ROLES = [ROLES.PROJECTS];

export const bugsService = createCrudService<BugInput>(BugModel as never, 'Bug');
// Bugs belongs to the Projects domain in the consolidated role model.
const crud = createCrudResolvers(bugsService, {
  name: 'Bug',
  roles: BUG_ROLES,
  table: {
    searchFields: ['title', 'description', 'assigneeName', 'projectName', 'taskKey'],
    filterFields: ['title', 'description', 'assigneeName', 'projectName', 'severity', 'status'],
    sortFields: [
      'title',
      'assigneeName',
      'projectName',
      'severity',
      'status',
      'taskKey',
      'dueDate',
      'createdAt',
    ],
    defaultSort: { field: 'createdAt', dir: 'DESC' },
  },
  stats: { countBy: ['status', 'severity'] },
});

/**
 * The names are looked up from their ids here, never trusted from the form, and who attached
 * a file is stamped from the session rather than taken from the client.
 */
async function withNames(input: BugInput, ctx: GraphQLContext): Promise<BugInput> {
  const [projectName, assigneeName] = await Promise.all([
    projectNameFor(input.projectId),
    assigneeNameFor(input.assigneeId),
  ]);
  const attachments =
    input.attachments === undefined
      ? undefined
      : (toAttachments(input.attachments, ctx.user?.email ?? '') as unknown as AttachmentInput[]);
  return {
    ...input,
    projectId: input.projectId ?? '',
    assigneeId: input.assigneeId ?? '',
    projectName,
    assigneeName,
    attachments,
  };
}

const createBug = async (p: unknown, args: never, ctx: GraphQLContext) => {
  const { input } = args as unknown as { input: BugInput };
  const completed = { input: await withNames(input, ctx) } as unknown as never;
  return crud.Mutation.createBug(p, completed, ctx);
};

const updateBug = async (p: unknown, args: never, ctx: GraphQLContext) => {
  const { id, input } = args as unknown as { id: string; input: BugInput };
  const completed = { id, input: await withNames(input, ctx) } as unknown as never;
  return crud.Mutation.updateBug(p, completed, ctx);
};

/** Promotion edits the bug and creates a ticket, so it needs the bug's EDIT permission. */
const promoteBug = async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
  await assertPermission(ctx, 'Bug', BUG_ROLES, 'EDIT');
  return serializeTask(await promoteBugToTask(id, await actorOf(ctx)));
};

export const bugsResolvers = {
  /** Written before these fields existed, a `.lean()` row comes back without them. */
  Bug: {
    projectName: (bug: BugRow) => bug.projectName ?? '',
    assigneeId: (bug: BugRow) => bug.assigneeId ?? '',
    // The legacy free-text assignee still renders on rows written before it was a user.
    assigneeName: (bug: BugRow) => bug.assigneeName || bug.assignee || '',
    taskKey: (bug: BugRow) => bug.taskKey ?? '',
    stepsToReproduce: (bug: BugRow) => bug.stepsToReproduce ?? '',
    publicLink: (bug: BugRow) => bug.publicLink ?? '',
    privateLink: (bug: BugRow) => bug.privateLink ?? '',
    attachments: (bug: BugRow) => bug.attachments ?? [],
  },
  Query: crud.Query,
  Mutation: { ...crud.Mutation, createBug, updateBug, promoteBugToTask: promoteBug },
};
export { bugsTypeDefs } from './bugs.typeDefs';
