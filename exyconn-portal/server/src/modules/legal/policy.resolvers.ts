import { PolicyModel, type PolicyAudience } from './policy.model';
import { PolicyAcknowledgementModel } from './policy-acknowledgement.model';
import { policyAcknowledgementService } from './policy-acknowledgement.service';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { assertRole, assertAuthenticated } from '../../middleware/roleGuard';
import { ROLES } from '../../constants/roles';
import { withId, withIds } from '../../utils/serialize';
import { notFound } from '../../utils/errors';
import type { GraphQLContext } from '../../middleware/auth';
import { tableQuery, tableStats, type TableQueryInput } from '../../utils/tableQuery';
import {
  assertPolicyCategory,
  assertPolicyInScope,
  policyScope,
  POLICY_ROLES,
} from './policy.scope';

const legalRoles = [ROLES.LEGAL];

interface PolicyInput {
  title: string;
  slug: string;
  summary?: string;
  body: string;
  audience: PolicyAudience;
  effectiveDate: Date;
  requiresAcknowledgement?: boolean;
  owner?: string;
  category?: string | null;
}

/** What the policy grids search, filter and sort on — Legal's and IT's alike. */
export const POLICY_TABLE = {
  searchFields: ['title', 'slug', 'summary', 'owner'],
  filterFields: ['title', 'slug', 'audience', 'status', 'category'],
  sortFields: ['title', 'slug', 'audience', 'status', 'version', 'effectiveDate', 'updatedAt'],
  defaultSort: { field: 'updatedAt', dir: 'DESC' as const },
};
const POLICY_STATS = { countBy: ['status', 'audience', 'category'] };

export const policiesService = createCrudService<PolicyInput>(PolicyModel as never, 'Policy');

const policies = createCrudResolvers(policiesService, {
  name: 'Policy',
  // Otherwise the factory generates listPolicys, which the schema does not declare.
  plural: 'Policies',
  roles: POLICY_ROLES,
  table: POLICY_TABLE,
  stats: POLICY_STATS,
});

type IdArgs = { id: string };
type InputArgs = { input: PolicyInput };

/**
 * The register reads, narrowed to what the caller may maintain. The generated versions read
 * the whole collection, which would hand IT every HR-only draft.
 */
const scopedPolicyQueries = {
  listPolicies: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
    const rows = await PolicyModel.find(policyScope(ctx)).sort({ updatedAt: -1 }).lean();
    return withIds(rows);
  },
  listPoliciesPaged: async (
    _p: unknown,
    { input }: { input: TableQueryInput },
    ctx: GraphQLContext,
  ) => {
    const page = await tableQuery(PolicyModel, input, POLICY_TABLE, policyScope(ctx));
    return { rows: withIds(page.rows as Array<{ _id: unknown }>), totalCount: page.totalCount };
  },
  listPoliciesStats: (_p: unknown, _a: unknown, ctx: GraphQLContext) =>
    tableStats(PolicyModel, POLICY_STATS, policyScope(ctx)),
  getPolicy: async (_p: unknown, { id }: IdArgs, ctx: GraphQLContext) => {
    await assertPolicyInScope(policyScope(ctx), id);
    return policies.Query.getPolicy(_p, { id } as never, ctx);
  },
};

/** Writes, refused when an IT-only caller reaches outside IT's categories. */
const scopedPolicyMutations = {
  createPolicy: async (p: unknown, args: InputArgs, ctx: GraphQLContext) => {
    assertPolicyCategory(policyScope(ctx), args.input.category);
    return policies.Mutation.createPolicy(p, args as never, ctx);
  },
  updatePolicy: async (p: unknown, args: IdArgs & InputArgs, ctx: GraphQLContext) => {
    const scope = policyScope(ctx);
    assertPolicyCategory(scope, args.input.category);
    await assertPolicyInScope(scope, args.id);
    return policies.Mutation.updatePolicy(p, args as never, ctx);
  },
  deletePolicy: async (p: unknown, args: IdArgs, ctx: GraphQLContext) => {
    await assertPolicyInScope(policyScope(ctx), args.id);
    return policies.Mutation.deletePolicy(p, args as never, ctx);
  },
};

/**
 * Which audiences a person may read.
 *
 * HR_ONLY is for policies about handling other people's employment — grievance procedure,
 * disciplinary process — which every member of staff should NOT see by default. Everything
 * else meant for staff is ALL_STAFF, and PUBLIC is additionally on the website.
 */
function audiencesFor(roles: readonly string[]): PolicyAudience[] {
  const visible: PolicyAudience[] = ['ALL_STAFF', 'PUBLIC'];
  if (roles.includes(ROLES.HR) || roles.includes(ROLES.LEGAL) || roles.includes(ROLES.ADMIN)) {
    visible.push('HR_ONLY');
  }
  return visible;
}

/**
 * Publishes a policy.
 *
 * `raiseVersion` is the whole decision. Changed wording means the thing people signed is no
 * longer the thing in force, so the version goes up and everybody is asked again; a typo fix
 * leaves it alone rather than pointlessly re-collecting hundreds of signatures.
 */
async function publishPolicy(
  _p: unknown,
  { id, raiseVersion }: { id: string; raiseVersion?: boolean | null },
  ctx: GraphQLContext,
) {
  const actor = assertRole(ctx, POLICY_ROLES);
  await assertPolicyInScope(policyScope(ctx), id);
  const policy = await PolicyModel.findById(id);
  if (!policy) {
    notFound('Policy');
  }
  if (raiseVersion && policy.status === 'PUBLISHED') {
    policy.version += 1;
  }
  policy.status = 'PUBLISHED';
  // Publishing IS the approval: the person who put it in force is the one a standard asks
  // about, and recording it here means nobody has to remember to type it afterwards.
  policy.approvedByName = ctx.user?.email ?? actor.id;
  policy.approvedOn = new Date();
  policy.publishedAt = new Date();
  policy.updatedBy = ctx.user?.email ?? actor.id;
  await policy.save();
  return withId(policy.toObject());
}

async function archivePolicy(_p: unknown, { id }: { id: string }, ctx: GraphQLContext) {
  await assertPolicyInScope(policyScope(ctx), id);
  const policy = await PolicyModel.findByIdAndUpdate(
    id,
    { status: 'ARCHIVED' },
    { new: true },
  ).lean();
  if (!policy) {
    notFound('Policy');
  }
  return withId(policy);
}

/**
 * Records one person's signature on the version currently published.
 *
 * The identity comes from the token, never from the arguments: `signedName` is what the
 * person typed as their signature, and letting a caller also choose WHOSE signature it was
 * would make the whole record worthless. The audience check is this resolver's own — the
 * signing itself is shared with the desktop tracker's consent screen.
 */
async function acknowledgePolicy(
  _p: unknown,
  { policyId, signedName }: { policyId: string; signedName: string },
  ctx: GraphQLContext,
) {
  const user = assertAuthenticated(ctx);

  const policy = await PolicyModel.findById(policyId).lean();
  if (!policy || !audiencesFor(user.roles).includes(policy.audience)) {
    notFound('Policy');
  }

  return withId(await policyAcknowledgementService.sign(user.id, policyId, signedName));
}

export const policyResolvers = {
  Policy: {
    /** Policies written before categories existed read as GENERAL. */
    category: (policy: { category?: string | null }) => policy.category ?? 'GENERAL',
    /**
     * Whether its review date has passed.
     *
     * Derived rather than stored: a stored flag is only true until the clock moves, and the
     * whole point of a review date is that it comes due while nobody is looking at it.
     */
    reviewOverdue: (policy: { nextReviewOn?: Date | string | null; status: string }) => {
      if (!policy.nextReviewOn || policy.status !== 'PUBLISHED') {
        return false;
      }
      return new Date(policy.nextReviewOn).getTime() < Date.now();
    },
    /** Signatures on the CURRENT version — an older version's count would flatter the number. */
    acknowledgedCount: (policy: { id?: string; _id?: unknown; version: number }) =>
      PolicyAcknowledgementModel.countDocuments({
        policyId: policy.id ?? String(policy._id),
        version: policy.version,
      }),
  },

  Query: {
    ...policies.Query,
    ...scopedPolicyQueries,
    policyAcknowledgements: async (
      _p: unknown,
      { policyId }: { policyId: string },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, legalRoles);
      return withIds(
        await PolicyAcknowledgementModel.find({ policyId }).sort({ signedAt: -1 }).lean(),
      );
    },

    /** Any signed-in employee: what they are meant to read, and what they have signed. */
    myPolicies: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      const user = assertAuthenticated(ctx);
      const rows = await PolicyModel.find({
        status: 'PUBLISHED',
        audience: { $in: audiencesFor(user.roles) },
      })
        .sort({ effectiveDate: -1 })
        .lean();

      const signed = await PolicyAcknowledgementModel.find({ userId: user.id }).lean();
      const signatures = new Map(
        signed.map((row) => [`${row.policyId}:${row.version}`, row.signedAt]),
      );

      return rows.map((policy) => {
        const signedAt = signatures.get(`${String(policy._id)}:${policy.version}`) ?? null;
        return {
          ...withId(policy),
          acknowledged: signedAt !== null,
          acknowledgedAt: signedAt,
        };
      });
    },

    myPolicy: async (_p: unknown, { slug }: { slug: string }, ctx: GraphQLContext) => {
      const user = assertAuthenticated(ctx);
      const policy = await PolicyModel.findOne({
        slug,
        status: 'PUBLISHED',
        audience: { $in: audiencesFor(user.roles) },
      }).lean();
      if (!policy) {
        return null;
      }
      const signature = await PolicyAcknowledgementModel.findOne({
        policyId: String(policy._id),
        userId: user.id,
        version: policy.version,
      }).lean();
      return {
        ...withId(policy),
        acknowledged: signature !== null,
        acknowledgedAt: signature?.signedAt ?? null,
      };
    },

    /**
     * The website. Unauthenticated by design, and deliberately narrow: only PUBLISHED and
     * only PUBLIC, so an internal handbook cannot be reached by guessing a slug.
     */
    publicPolicies: async () =>
      PolicyModel.find({ status: 'PUBLISHED', audience: 'PUBLIC' }).sort({ title: 1 }).lean(),
    publicPolicy: async (_p: unknown, { slug }: { slug: string }) =>
      PolicyModel.findOne({ slug, status: 'PUBLISHED', audience: 'PUBLIC' }).lean(),
  },

  Mutation: {
    ...policies.Mutation,
    ...scopedPolicyMutations,
    publishPolicy,
    archivePolicy,
    acknowledgePolicy,
  },
};

export { policyTypeDefs } from './policy.typeDefs';
