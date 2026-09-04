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
}

export const policiesService = createCrudService<PolicyInput>(PolicyModel as never, 'Policy');

const policies = createCrudResolvers(policiesService, {
  name: 'Policy',
  // Otherwise the factory generates listPolicys, which the schema does not declare.
  plural: 'Policies',
  roles: legalRoles,
  table: {
    searchFields: ['title', 'slug', 'summary', 'owner'],
    filterFields: ['title', 'slug', 'audience', 'status'],
    sortFields: ['title', 'slug', 'audience', 'status', 'version', 'effectiveDate', 'updatedAt'],
    defaultSort: { field: 'updatedAt', dir: 'DESC' },
  },
  stats: { countBy: ['status', 'audience'] },
});

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
  const actor = assertRole(ctx, legalRoles);
  const policy = await PolicyModel.findById(id);
  if (!policy) {
    notFound('Policy');
  }
  if (raiseVersion && policy.status === 'PUBLISHED') {
    policy.version += 1;
  }
  policy.status = 'PUBLISHED';
  policy.publishedAt = new Date();
  policy.updatedBy = ctx.user?.email ?? actor.id;
  await policy.save();
  return withId(policy.toObject());
}

async function archivePolicy(_p: unknown, { id }: { id: string }, ctx: GraphQLContext) {
  assertRole(ctx, legalRoles);
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
    /** Signatures on the CURRENT version — an older version's count would flatter the number. */
    acknowledgedCount: (policy: { id?: string; _id?: unknown; version: number }) =>
      PolicyAcknowledgementModel.countDocuments({
        policyId: policy.id ?? String(policy._id),
        version: policy.version,
      }),
  },

  Query: {
    ...policies.Query,
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
    publishPolicy,
    archivePolicy,
    acknowledgePolicy,
  },
};

export { policyTypeDefs } from './policy.typeDefs';
