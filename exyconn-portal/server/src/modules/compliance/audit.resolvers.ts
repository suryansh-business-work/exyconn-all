import { InternalAuditModel } from './audit.model';
import { FindingModel } from './finding.model';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { nextSequence } from '../../lib/sequence';
import { ROLES } from '../../constants/roles';
import { withIds } from '../../utils/serialize';
import { toAttachments, type Attachment, type AttachmentInput } from '../../lib/attachments';
import { assertAuthenticated } from '../../middleware/roleGuard';
import type { GraphQLContext } from '../../middleware/auth';

const AUDIT_SERIES = 'compliance-audit';
const AUDIT_PREFIX = 'AUD-';

export interface InternalAuditInput {
  title: string;
  kind: string;
  standards: string[];
  scope: string;
  criteria: string;
  leadAuditorId: string;
  leadAuditorName: string;
  auditeeName: string;
  plannedOn: Date;
  performedOn?: Date | null;
  status: string;
  summary: string;
  conclusion: string;
  evidence?: AttachmentInput[] | null;
}

export const internalAuditsService = createCrudService<InternalAuditInput & { reference: string }>(
  InternalAuditModel as never,
  'InternalAudit',
);

const crud = createCrudResolvers(internalAuditsService, {
  name: 'InternalAudit',
  plural: 'InternalAudits',
  roles: [ROLES.COMPLIANCE],
  table: {
    searchFields: ['reference', 'title', 'scope', 'criteria', 'leadAuditorName', 'auditeeName'],
    filterFields: ['kind', 'status', 'leadAuditorId'],
    sortFields: ['reference', 'title', 'kind', 'status', 'plannedOn', 'createdAt'],
    defaultSort: { field: 'plannedOn', dir: 'DESC' },
  },
  stats: { countBy: ['status', 'kind'] },
});

/**
 * Who attached a paper and when, stamped here rather than taken from the client — an auditor
 * reads both as part of the evidence.
 */
function withEvidence(input: InternalAuditInput, ctx: GraphQLContext) {
  if (input.evidence === undefined) {
    return input;
  }
  const by = ctx.user?.email ?? '';
  return { ...input, evidence: toAttachments(input.evidence, by) as unknown as AttachmentInput[] };
}

/** An audit is cited by its reference in every finding it raises, so it draws one on create. */
async function createInternalAudit(
  _p: unknown,
  { input }: { input: InternalAuditInput },
  ctx: GraphQLContext,
) {
  assertAuthenticated(ctx);
  const reference = await nextSequence(AUDIT_SERIES, AUDIT_PREFIX);
  const completed = { ...withEvidence(input, ctx), reference };
  return crud.Mutation.createInternalAudit(_p, { input: completed } as never, ctx);
}

async function updateInternalAudit(
  _p: unknown,
  args: { id: string; input: InternalAuditInput },
  ctx: GraphQLContext,
) {
  assertAuthenticated(ctx);
  const completed = { id: args.id, input: withEvidence(args.input, ctx) };
  return crud.Mutation.updateInternalAudit(_p, completed as never, ctx);
}

export const auditResolvers = {
  Query: crud.Query,
  Mutation: { ...crud.Mutation, createInternalAudit, updateInternalAudit },
  InternalAudit: {
    /** Written before evidence existed, a `.lean()` row comes back without the field. */
    evidence: (row: { evidence?: Attachment[] | null }) => row.evidence ?? [],
    /** What this audit raised, so the report and its findings are read together. */
    findings: (audit: { id: string }) =>
      FindingModel.find({ auditId: audit.id })
        .sort({ createdAt: 1 })
        .lean()
        .then((rows) => withIds(rows)),
  },
};
