import { InternalAuditModel } from './audit.model';
import { FindingModel } from './finding.model';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { nextSequence } from '../../lib/sequence';
import { ROLES } from '../../constants/roles';
import { withIds } from '../../utils/serialize';
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

/** An audit is cited by its reference in every finding it raises, so it draws one on create. */
async function createInternalAudit(
  _p: unknown,
  { input }: { input: InternalAuditInput },
  ctx: GraphQLContext,
) {
  const reference = await nextSequence(AUDIT_SERIES, AUDIT_PREFIX);
  return crud.Mutation.createInternalAudit(_p, { input: { ...input, reference } } as never, ctx);
}

export const auditResolvers = {
  Query: crud.Query,
  Mutation: { ...crud.Mutation, createInternalAudit },
  InternalAudit: {
    /** What this audit raised, so the report and its findings are read together. */
    findings: (audit: { id: string }) =>
      FindingModel.find({ auditId: audit.id })
        .sort({ createdAt: 1 })
        .lean()
        .then((rows) => withIds(rows)),
  },
};
