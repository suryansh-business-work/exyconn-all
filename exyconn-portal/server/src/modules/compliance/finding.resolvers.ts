import { FindingModel } from './finding.model';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { nextSequence } from '../../lib/sequence';
import { ROLES } from '../../constants/roles';
import { badRequest } from '../../utils/errors';
import { toAttachments, type Attachment, type AttachmentInput } from '../../lib/attachments';
import { assertAuthenticated } from '../../middleware/roleGuard';
import type { GraphQLContext } from '../../middleware/auth';

const FINDING_SERIES = 'compliance-finding';
const FINDING_PREFIX = 'NC-';

export interface FindingInput {
  title: string;
  description: string;
  source: string;
  auditId: string;
  riskId: string;
  standards: string[];
  category: string;
  clause: string;
  type: string;
  immediateAction: string;
  rootCause: string;
  correctiveAction: string;
  ownerId: string;
  ownerName: string;
  raisedOn: Date;
  dueOn?: Date | null;
  status: string;
  verifiedOn?: Date | null;
  verifiedByName?: string;
  effective?: boolean | null;
  effectivenessNote?: string;
  closedOn?: Date | null;
  evidence?: AttachmentInput[] | null;
}

export const findingsService = createCrudService<FindingInput & { reference: string }>(
  FindingModel as never,
  'Finding',
);

const crud = createCrudResolvers(findingsService, {
  name: 'Finding',
  roles: [ROLES.COMPLIANCE],
  table: {
    searchFields: ['reference', 'title', 'description', 'clause', 'ownerName', 'rootCause'],
    filterFields: ['source', 'type', 'status', 'category', 'ownerId', 'auditId'],
    sortFields: ['reference', 'title', 'type', 'status', 'raisedOn', 'dueOn', 'createdAt'],
    defaultSort: { field: 'raisedOn', dir: 'DESC' },
  },
  stats: { countBy: ['status', 'type', 'source'] },
});

/**
 * A nonconformity closes on evidence, not on good intentions.
 *
 * Clause 10.2 ends by asking whether the corrective action WORKED, so a finding cannot be
 * marked closed until somebody has recorded that it was verified and said whether it was
 * effective. Refusing this in the resolver rather than in the form is deliberate: the rule is
 * what an auditor tests, and a rule only the UI knows is a rule the API does not have.
 */
function assertMayClose(input: Partial<FindingInput>, stored: Partial<FindingInput>): void {
  if (input.status !== 'CLOSED') {
    return;
  }
  const verifiedOn = input.verifiedOn ?? stored.verifiedOn;
  const effective = input.effective ?? stored.effective;
  if (!verifiedOn || effective === null || effective === undefined) {
    badRequest(
      'A finding is closed once its corrective action has been verified. ' +
        'Record the verification date and whether it was effective first.',
    );
  }
}

/**
 * Evidence, with who attached it and when stamped here rather than taken from the client.
 *
 * An auditor reads the uploader and the date as part of the evidence; a client that could
 * write them could also write somebody else's name on a file they uploaded themselves.
 */
function withEvidence(input: FindingInput, ctx: GraphQLContext) {
  if (input.evidence === undefined) {
    return input;
  }
  const by = ctx.user?.email ?? '';
  return { ...input, evidence: toAttachments(input.evidence, by) as unknown as AttachmentInput[] };
}

async function createFinding(_p: unknown, { input }: { input: FindingInput }, ctx: GraphQLContext) {
  assertAuthenticated(ctx);
  assertMayClose(input, {});
  const reference = await nextSequence(FINDING_SERIES, FINDING_PREFIX);
  const completed = { ...withEvidence(input, ctx), reference };
  return crud.Mutation.createFinding(_p, { input: completed } as never, ctx);
}

async function updateFinding(
  _p: unknown,
  args: { id: string; input: FindingInput },
  ctx: GraphQLContext,
) {
  assertAuthenticated(ctx);
  const stored = await FindingModel.findById(args.id).select('verifiedOn effective').lean();
  assertMayClose(args.input, (stored ?? {}) as Partial<FindingInput>);
  const completed = { id: args.id, input: withEvidence(args.input, ctx) };
  return crud.Mutation.updateFinding(_p, completed as never, ctx);
}

export const findingResolvers = {
  /** Written before evidence existed, a `.lean()` row comes back without the field. */
  Finding: {
    evidence: (row: { evidence?: Attachment[] | null }) => row.evidence ?? [],
  },
  Query: crud.Query,
  Mutation: { ...crud.Mutation, createFinding, updateFinding },
};
