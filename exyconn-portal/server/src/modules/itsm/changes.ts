import { isValidObjectId, type Model } from 'mongoose';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { assertPermission } from '../../lib/permissions';
import { ROLES } from '../../constants/roles';
import { badRequest, notFound } from '../../utils/errors';
import type { GraphQLContext } from '../../middleware/auth';
import { ItChangeModel } from './models';
import { decideRecord, type DecidableRecord, type ItDecision } from './decision';

export const CHANGE_MODULE = 'ItChange';
const itOnly = [ROLES.IT];

interface ChangeInput {
  status: string;
  type: string;
  plannedStart: Date;
  plannedEnd: Date;
}

const crud = createCrudResolvers(createCrudService(ItChangeModel as never, CHANGE_MODULE), {
  name: CHANGE_MODULE,
  roles: itOnly,
  table: {
    searchFields: ['title', 'description', 'system', 'ownerName'],
    filterFields: ['title', 'type', 'risk', 'environment', 'status', 'system'],
    sortFields: ['title', 'type', 'risk', 'status', 'plannedStart', 'createdAt'],
    defaultSort: { field: 'plannedStart', dir: 'DESC' },
  },
  stats: { countBy: ['status', 'type', 'risk'] },
});

export const CHANGE_AWAITING: ReadonlySet<string> = new Set(['PENDING_APPROVAL']);

export const changeDecision = {
  label: 'Change',
  awaiting: CHANGE_AWAITING,
  link: '/it/changes',
  describe: (row: Record<string, unknown>) => String(row.title),
};

/** Only the approvals step may set these. */
const DECIDED = new Set(['APPROVED', 'REJECTED']);
/** Statuses that mean the change is going ahead or has gone ahead. */
const UNDER_WAY = new Set(['SCHEDULED', 'IMPLEMENTED', 'FAILED', 'ROLLED_BACK']);
/** Where a change must already be before it may be scheduled or carried out. */
const CLEARED = new Set(['APPROVED', ...UNDER_WAY]);

/**
 * Refuses a status the change has not earned. A STANDARD change is pre-approved by
 * definition, so it may go straight to scheduled; everything else must have been approved.
 */
function assertTransition(input: ChangeInput, current: string | null): void {
  if (input.plannedEnd < input.plannedStart) {
    badRequest('The change window must end after it starts');
  }
  if (DECIDED.has(input.status) && input.status !== current) {
    badRequest('Approve or reject a change from the approval action, not the form');
  }
  const preApproved = input.type === 'STANDARD';
  if (UNDER_WAY.has(input.status) && !preApproved && !CLEARED.has(current ?? '')) {
    badRequest('A change must be approved before it is scheduled or carried out');
  }
}

/** Stamps when it was carried out, the first time it is marked implemented. */
const withImplementedAt = (input: ChangeInput, current: { implementedAt?: Date | null } | null) =>
  input.status === 'IMPLEMENTED' && !current?.implementedAt
    ? { ...input, implementedAt: new Date() }
    : input;

async function currentChange(id: string) {
  const row = isValidObjectId(id) ? await ItChangeModel.findById(id).lean() : null;
  if (!row) {
    notFound('Change');
  }
  return row;
}

export const itChangeResolvers = {
  Query: crud.Query,
  Mutation: {
    ...crud.Mutation,
    createItChange: async (p: unknown, args: { input: ChangeInput }, ctx: GraphQLContext) => {
      assertTransition(args.input, null);
      const input = { ...withImplementedAt(args.input, null), requestedById: ctx.user?.id ?? '' };
      return crud.Mutation.createItChange(p, { input } as never, ctx);
    },
    updateItChange: async (
      p: unknown,
      args: { id: string; input: ChangeInput },
      ctx: GraphQLContext,
    ) => {
      const current = await currentChange(args.id);
      assertTransition(args.input, current.status);
      const input = withImplementedAt(args.input, current);
      return crud.Mutation.updateItChange(p, { id: args.id, input } as never, ctx);
    },
    decideItChange: async (
      _p: unknown,
      args: { id: string; decision: ItDecision; note?: string | null },
      ctx: GraphQLContext,
    ) => {
      await assertPermission(ctx, CHANGE_MODULE, itOnly, 'APPROVE');
      return decideRecord(
        ItChangeModel as unknown as Model<DecidableRecord>,
        changeDecision,
        args,
        ctx,
      );
    },
  },
};
