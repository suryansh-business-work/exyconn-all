import { isValidObjectId } from 'mongoose';
import { assertPermission } from '../../lib/permissions';
import { badRequest, notFound } from '../../utils/errors';
import { withIds } from '../../utils/serialize';
import type { GraphQLContext } from '../../middleware/auth';
import { UserModel } from '../admin/user.model';
import { AssetModel } from '../assets/asset.model';
import { OnboardingChecklistModel } from '../onboarding/onboarding.model';
import { ExitRecordModel } from '../exit/exit.model';
import { ItAccessRequestModel } from './models';
import { ACCESS_MODULE, activeAccessOf, type ActiveAccess } from './access';
import { INSIGHTS_MODULE, itOnly } from './dashboard';
import { getItSettings } from './settings';

/** How many joiners / leavers each list shows. */
const LIST_LIMIT = 50;
/** Exits in these stages are either done with or called off. */
const CLOSED_EXIT_STAGES = ['EXITED', 'WITHDRAWN'];
/** A request still being worked, so creating another for the same app would duplicate it. */
const OPEN_REQUEST = ['PENDING', 'APPROVED'];

const appKey = (application: string) => application.trim().toLowerCase();

/** Groups a flat list by employee id. */
function byEmployee<T extends { employeeId: string }>(rows: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    grouped.set(row.employeeId, [...(grouped.get(row.employeeId) ?? []), row]);
  }
  return grouped;
}

/** Open access requests per employee, as `employeeId|kind|app` keys. */
async function openRequestKeys(employeeIds: string[]): Promise<Set<string>> {
  const rows = await ItAccessRequestModel.find({
    employeeId: { $in: employeeIds },
    status: { $in: OPEN_REQUEST },
  })
    .select('employeeId kind application')
    .lean();
  return new Set(rows.map((row) => `${row.employeeId}|${row.kind}|${appKey(row.application)}`));
}

/** The onboarding applications a joiner neither holds nor has a request open for. */
function missingApplications(
  employeeId: string,
  wanted: string[],
  held: ActiveAccess[],
  open: Set<string>,
): string[] {
  const holding = new Set(held.map((grant) => appKey(grant.application)));
  return wanted.filter(
    (app) => !holding.has(appKey(app)) && !open.has(`${employeeId}|GRANT|${appKey(app)}`),
  );
}

/** Joiners whose checklists give IT something to do, newest first, with their access. */
export async function itOnboarding(_p: unknown, _a: unknown, ctx: GraphQLContext) {
  await assertPermission(ctx, INSIGHTS_MODULE, itOnly, 'VIEW');
  const checklists = await OnboardingChecklistModel.find({ 'items.owner': 'IT' })
    .sort({ joinDate: -1 })
    .limit(LIST_LIMIT)
    .lean();
  const ids = checklists.map((row) => row.employeeId);
  const [settings, access, open] = await Promise.all([
    getItSettings(),
    activeAccessOf(ids),
    openRequestKeys(ids),
  ]);
  const accessBy = byEmployee(access);
  return checklists.map((checklist) => {
    const items = checklist.items.filter((item) => item.owner === 'IT');
    const held = accessBy.get(checklist.employeeId) ?? [];
    return {
      checklistId: String(checklist._id),
      employeeId: checklist.employeeId,
      employeeName: checklist.employeeName,
      joinDate: checklist.joinDate,
      items,
      pendingItems: items.filter((item) => !item.done).length,
      access: held,
      missingApplications: missingApplications(
        checklist.employeeId,
        settings.onboardingApplications,
        held,
        open,
      ),
    };
  });
}

/** Leavers still being worked through, with what they hold that has to come back. */
export async function itOffboarding(_p: unknown, _a: unknown, ctx: GraphQLContext) {
  await assertPermission(ctx, INSIGHTS_MODULE, itOnly, 'VIEW');
  const exits = await ExitRecordModel.find({ stage: { $nin: CLOSED_EXIT_STAGES } })
    .sort({ lastWorkingDate: 1 })
    .limit(LIST_LIMIT)
    .lean();
  const ids = exits.map((row) => row.employeeId);
  const [users, assets, access, open] = await Promise.all([
    UserModel.find({ _id: { $in: ids.filter((id) => isValidObjectId(id)) } })
      .select('name isActive')
      .lean(),
    AssetModel.find({ assignedToId: { $in: ids } }).lean(),
    activeAccessOf(ids),
    openRequestKeys(ids),
  ]);
  const userBy = new Map(users.map((user) => [String(user._id), user]));
  const assetsBy = byEmployee(
    assets.map((asset) => ({ ...asset, employeeId: asset.assignedToId })),
  );
  const accessBy = byEmployee(access);
  return exits.map((exit) => {
    const held = accessBy.get(exit.employeeId) ?? [];
    return {
      exitId: String(exit._id),
      employeeId: exit.employeeId,
      employeeName: userBy.get(exit.employeeId)?.name ?? exit.employeeId,
      stage: exit.stage,
      lastWorkingDate: exit.lastWorkingDate ?? null,
      accountActive: userBy.get(exit.employeeId)?.isActive ?? false,
      knowledgeTransferDone: exit.knowledgeTransferDone,
      assets: withIds(assetsBy.get(exit.employeeId) ?? []),
      access: held,
      revokesPending: held.filter((grant) =>
        open.has(`${exit.employeeId}|REVOKE|${appKey(grant.application)}`),
      ).length,
    };
  });
}

/**
 * Opens one pre-approved request per application. Joining and leaving are policy, not a
 * judgement call, so these skip the approval step and go straight to IT to carry out.
 */
async function openPreApproved(
  employeeId: string,
  kind: 'GRANT' | 'REVOKE',
  applications: string[],
  reason: string,
) {
  const employee = isValidObjectId(employeeId)
    ? await UserModel.findById(employeeId).select('name').lean()
    : null;
  if (!employee) {
    notFound('Employee');
  }
  const created = await ItAccessRequestModel.create(
    applications.map((application) => ({
      employeeId,
      employeeName: employee.name,
      application,
      kind,
      reason,
      status: 'APPROVED',
      decidedByName: kind === 'GRANT' ? 'Onboarding policy' : 'Offboarding policy',
      decidedAt: new Date(),
    })),
  );
  return withIds(created.map((row) => row.toObject()));
}

/** Requests every onboarding application the joiner does not have yet. */
export async function itProvisionOnboarding(
  _p: unknown,
  { employeeId }: { employeeId: string },
  ctx: GraphQLContext,
) {
  await assertPermission(ctx, ACCESS_MODULE, itOnly, 'CREATE');
  const [settings, access, open] = await Promise.all([
    getItSettings(),
    activeAccessOf([employeeId]),
    openRequestKeys([employeeId]),
  ]);
  const missing = missingApplications(employeeId, settings.onboardingApplications, access, open);
  if (missing.length === 0) {
    badRequest('This joiner already has, or has requests open for, every onboarding application');
  }
  return openPreApproved(employeeId, 'GRANT', missing, 'New joiner onboarding');
}

/** Requests the removal of everything a leaver still holds. */
export async function itRevokeAllAccess(
  _p: unknown,
  { employeeId }: { employeeId: string },
  ctx: GraphQLContext,
) {
  await assertPermission(ctx, ACCESS_MODULE, itOnly, 'CREATE');
  const [access, open] = await Promise.all([
    activeAccessOf([employeeId]),
    openRequestKeys([employeeId]),
  ]);
  const toRevoke = access
    .map((grant) => grant.application)
    .filter((app) => !open.has(`${employeeId}|REVOKE|${appKey(app)}`));
  if (toRevoke.length === 0) {
    badRequest('Nothing left to revoke for this employee');
  }
  return openPreApproved(employeeId, 'REVOKE', toRevoke, 'Employee offboarding');
}
