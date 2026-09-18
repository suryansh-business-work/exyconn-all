import { isValidObjectId } from 'mongoose';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { assertPermission } from '../../lib/permissions';
import { actorNameOf } from '../../lib/actor';
import { ROLES } from '../../constants/roles';
import { badRequest, notFound } from '../../utils/errors';
import { withId } from '../../utils/serialize';
import { UserModel } from '../admin/user.model';
import { notifyBestEffort } from '../notifications/notifications.service';
import type { GraphQLContext } from '../../middleware/auth';
import { ItAccessRequestModel } from './models';
import { decideRecord, type DecidableRecord, type ItDecision } from './decision';
import type { Model } from 'mongoose';

export const ACCESS_MODULE = 'ItAccessRequest';
const itOnly = [ROLES.IT];

interface AccessInput {
  employeeId: string;
  application: string;
  kind: string;
  accessLevel?: string | null;
  reason: string;
  expiresAt?: Date | null;
}

const crud = createCrudResolvers(createCrudService(ItAccessRequestModel as never, ACCESS_MODULE), {
  name: ACCESS_MODULE,
  roles: itOnly,
  table: {
    searchFields: ['employeeName', 'application', 'reason', 'requestedByName'],
    filterFields: ['employeeId', 'employeeName', 'application', 'kind', 'status'],
    sortFields: ['employeeName', 'application', 'kind', 'status', 'createdAt'],
    defaultSort: { field: 'createdAt', dir: 'DESC' },
  },
  stats: { countBy: ['kind', 'status'] },
});

/** Only a request nobody has acted on may still be edited — the rest is history. */
const EDITABLE = new Set(['PENDING']);
export const ACCESS_AWAITING: ReadonlySet<string> = new Set(['PENDING']);

export const accessDecision = {
  label: 'Access request',
  awaiting: ACCESS_AWAITING,
  link: '/it/access',
  describe: (row: Record<string, unknown>) => `${String(row.kind)} ${String(row.application)}`,
};

/** The employee's name is stored with the request so the history reads without a join. */
async function withEmployee(input: AccessInput) {
  if (!isValidObjectId(input.employeeId)) {
    badRequest('Pick an employee');
  }
  const employee = await UserModel.findById(input.employeeId).select('name').lean();
  if (!employee) {
    badRequest('That employee no longer exists');
  }
  return { ...input, employeeName: employee.name };
}

async function requestById(id: string) {
  const row = isValidObjectId(id) ? await ItAccessRequestModel.findById(id) : null;
  if (!row) {
    notFound('Access request');
  }
  return row;
}

/** Moves a request from one of `from` to `to`, stamping `stamp` with now when given. */
async function transition(
  id: string,
  from: ReadonlySet<string>,
  to: string,
  stamp?: 'fulfilledAt',
) {
  const row = await requestById(id);
  if (!from.has(row.status)) {
    badRequest(`A ${row.status.toLowerCase()} request cannot be moved to ${to.toLowerCase()}`);
  }
  row.status = to as typeof row.status;
  if (stamp) {
    row[stamp] = new Date();
  }
  await row.save();
  return withId(row.toObject());
}

export const itAccessResolvers = {
  Query: crud.Query,
  Mutation: {
    ...crud.Mutation,
    createItAccessRequest: async (
      p: unknown,
      args: { input: AccessInput },
      ctx: GraphQLContext,
    ) => {
      const input = {
        ...(await withEmployee(args.input)),
        status: 'PENDING',
        requestedById: ctx.user?.id ?? '',
        requestedByName: await actorNameOf(ctx),
      };
      return crud.Mutation.createItAccessRequest(p, { input } as never, ctx);
    },
    updateItAccessRequest: async (
      p: unknown,
      args: { id: string; input: AccessInput },
      ctx: GraphQLContext,
    ) => {
      const row = await requestById(args.id);
      if (!EDITABLE.has(row.status)) {
        badRequest('Only a pending request can be edited');
      }
      const input = await withEmployee(args.input);
      return crud.Mutation.updateItAccessRequest(p, { id: args.id, input } as never, ctx);
    },
    decideItAccessRequest: async (
      _p: unknown,
      args: { id: string; decision: ItDecision; note?: string | null },
      ctx: GraphQLContext,
    ) => {
      await assertPermission(ctx, ACCESS_MODULE, itOnly, 'APPROVE');
      return decideRecord(
        ItAccessRequestModel as unknown as Model<DecidableRecord>,
        accessDecision,
        args,
        ctx,
      );
    },
    fulfilItAccessRequest: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      await assertPermission(ctx, ACCESS_MODULE, itOnly, 'EDIT');
      const saved = await transition(id, new Set(['APPROVED']), 'FULFILLED', 'fulfilledAt');
      await notifyBestEffort(saved.employeeId, {
        kind: 'IT',
        title: `IT has completed your ${saved.kind.toLowerCase().replaceAll('_', ' ')} for ${saved.application}`,
        link: '/me',
      });
      return saved;
    },
    cancelItAccessRequest: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      await assertPermission(ctx, ACCESS_MODULE, itOnly, 'EDIT');
      return transition(id, new Set(['PENDING', 'APPROVED']), 'CANCELLED');
    },
  },
};

/** One application someone can get into right now, and since when. */
export interface ActiveAccess {
  employeeId: string;
  application: string;
  accessLevel: string;
  grantedAt: Date;
  expiresAt: Date | null;
}

/**
 * What each employee holds today, read off the fulfilled history: per application, the
 * latest fulfilled grant or role change wins unless a later revoke took it away. A password
 * reset changes nothing about what someone holds, so it is not part of this.
 */
export async function activeAccessOf(employeeIds: string[]): Promise<ActiveAccess[]> {
  const fulfilled = await ItAccessRequestModel.find({
    employeeId: { $in: employeeIds },
    status: 'FULFILLED',
    kind: { $ne: 'PASSWORD_RESET' },
  })
    .sort({ fulfilledAt: 1 })
    .lean();
  const latest = new Map<string, (typeof fulfilled)[number]>();
  for (const row of fulfilled) {
    latest.set(`${row.employeeId}|${row.application.toLowerCase()}`, row);
  }
  return [...latest.values()]
    .filter((row) => row.kind !== 'REVOKE')
    .map((row) => ({
      employeeId: row.employeeId,
      application: row.application,
      accessLevel: row.accessLevel,
      grantedAt: row.fulfilledAt ?? row.createdAt,
      expiresAt: row.expiresAt ?? null,
    }));
}
