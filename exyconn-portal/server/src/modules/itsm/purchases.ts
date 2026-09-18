import { isValidObjectId, type Model } from 'mongoose';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { assertPermission } from '../../lib/permissions';
import { ROLES } from '../../constants/roles';
import { badRequest, notFound } from '../../utils/errors';
import type { GraphQLContext } from '../../middleware/auth';
import { ItPurchaseRequestModel } from './models';
import { decideRecord, type DecidableRecord, type ItDecision } from './decision';

export const PURCHASE_MODULE = 'ItPurchaseRequest';
const itOnly = [ROLES.IT];

interface PurchaseInput {
  status: string;
  receivedAt?: Date | null;
}

const crud = createCrudResolvers(
  createCrudService(ItPurchaseRequestModel as never, PURCHASE_MODULE),
  {
    name: PURCHASE_MODULE,
    roles: itOnly,
    table: {
      searchFields: ['title', 'justification', 'requestedForName', 'orderReference'],
      filterFields: ['title', 'kind', 'status', 'requestedForName'],
      sortFields: ['title', 'kind', 'status', 'estimatedCost', 'quantity', 'createdAt'],
      defaultSort: { field: 'createdAt', dir: 'DESC' },
    },
    stats: { countBy: ['status', 'kind'], sum: ['estimatedCost'] },
  },
);

export const PURCHASE_AWAITING: ReadonlySet<string> = new Set(['REQUESTED', 'QUOTED']);

export const purchaseDecision = {
  label: 'Purchase request',
  awaiting: PURCHASE_AWAITING,
  link: '/it/procurement',
  describe: (row: Record<string, unknown>) => String(row.title),
};

const DECIDED = new Set(['APPROVED', 'REJECTED']);
/** Buying only happens after approval. */
const AFTER_APPROVAL = new Set(['ORDERED', 'RECEIVED']);
const CLEARED = new Set(['APPROVED', ...AFTER_APPROVAL]);

function assertTransition(next: string, current: string | null): void {
  if (DECIDED.has(next) && next !== current) {
    badRequest('Approve or reject a purchase from the approval action, not the form');
  }
  if (AFTER_APPROVAL.has(next) && !CLEARED.has(current ?? '')) {
    badRequest('A purchase must be approved before it is ordered');
  }
}

/** Stamps the delivery date the first time it is marked received. */
function withReceivedAt(input: PurchaseInput, current: Date | null): PurchaseInput {
  if (input.status !== 'RECEIVED') {
    return input;
  }
  return { ...input, receivedAt: current ?? new Date() };
}

export const itPurchaseResolvers = {
  Query: crud.Query,
  Mutation: {
    ...crud.Mutation,
    createItPurchaseRequest: async (
      p: unknown,
      args: { input: PurchaseInput },
      ctx: GraphQLContext,
    ) => {
      assertTransition(args.input.status, null);
      const input = { ...args.input, requestedById: ctx.user?.id ?? '' };
      return crud.Mutation.createItPurchaseRequest(p, { input } as never, ctx);
    },
    updateItPurchaseRequest: async (
      p: unknown,
      args: { id: string; input: PurchaseInput },
      ctx: GraphQLContext,
    ) => {
      const current = isValidObjectId(args.id)
        ? await ItPurchaseRequestModel.findById(args.id).lean()
        : null;
      if (!current) {
        notFound('Purchase request');
      }
      assertTransition(args.input.status, current.status);
      const input = withReceivedAt(args.input, current.receivedAt ?? null);
      return crud.Mutation.updateItPurchaseRequest(p, { id: args.id, input } as never, ctx);
    },
    decideItPurchaseRequest: async (
      _p: unknown,
      args: { id: string; decision: ItDecision; note?: string | null },
      ctx: GraphQLContext,
    ) => {
      await assertPermission(ctx, PURCHASE_MODULE, itOnly, 'APPROVE');
      return decideRecord(
        ItPurchaseRequestModel as unknown as Model<DecidableRecord>,
        purchaseDecision,
        args,
        ctx,
      );
    },
  },
};
