import { RiskModel } from './risk.model';
import { riskLevel } from './compliance.constants';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { nextSequence } from '../../lib/sequence';
import { ROLES } from '../../constants/roles';
import type { GraphQLContext } from '../../middleware/auth';

const RISK_SERIES = 'compliance-risk';
const RISK_PREFIX = 'RISK-';

export interface RiskInput {
  title: string;
  description: string;
  standards: string[];
  category: string;
  subject: string;
  ownerId: string;
  ownerName: string;
  likelihood: number;
  impact: number;
  treatment: string;
  controls: string;
  residualLikelihood: number;
  residualImpact: number;
  status: string;
  identifiedOn: Date;
  reviewDueOn?: Date | null;
  closedOn?: Date | null;
}

export const risksService = createCrudService<RiskInput & { reference: string }>(
  RiskModel as never,
  'Risk',
);

const crud = createCrudResolvers(risksService, {
  name: 'Risk',
  roles: [ROLES.COMPLIANCE],
  table: {
    searchFields: ['reference', 'title', 'description', 'subject', 'ownerName'],
    filterFields: ['category', 'status', 'treatment', 'ownerId'],
    sortFields: ['reference', 'title', 'category', 'status', 'reviewDueOn', 'createdAt'],
    defaultSort: { field: 'createdAt', dir: 'DESC' },
  },
  stats: { countBy: ['status', 'category'] },
});

/**
 * A risk draws its reference from the company's own series, so the register has no gaps and
 * no repeats however many people are filing at once — and a finding can cite exactly one row.
 */
async function createRisk(_p: unknown, { input }: { input: RiskInput }, ctx: GraphQLContext) {
  const reference = await nextSequence(RISK_SERIES, RISK_PREFIX);
  return crud.Mutation.createRisk(_p, { input: { ...input, reference } } as never, ctx);
}

/** The rating is arithmetic, so it is computed on read rather than stored and left stale. */
const score = (likelihood: number, impact: number) => likelihood * impact;

export const riskResolvers = {
  Query: crud.Query,
  Mutation: { ...crud.Mutation, createRisk },
  Risk: {
    inherentScore: (r: { likelihood: number; impact: number }) => score(r.likelihood, r.impact),
    inherentLevel: (r: { likelihood: number; impact: number }) =>
      riskLevel(score(r.likelihood, r.impact)),
    residualScore: (r: { residualLikelihood: number; residualImpact: number }) =>
      score(r.residualLikelihood, r.residualImpact),
    residualLevel: (r: { residualLikelihood: number; residualImpact: number }) =>
      riskLevel(score(r.residualLikelihood, r.residualImpact)),
  },
};
