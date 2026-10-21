import type { GraphQLContext } from '../../middleware/auth';
import { assertAuthenticated } from '../../middleware/roleGuard';
import { assertPermission, isAllowed, PERMISSION_MODULES } from '../../lib/permissions';
import { ROLES, type Role } from '../../constants/roles';
import { forbidden, notFound } from '../../utils/errors';
import { UserModel } from '../admin/user.model';
import { MA_PERMISSION_MODULE } from './ma.enums';
import { MaMeetingModel, type MaMeetingDocument } from './models';
import { getMaSettings } from './settings.service';

PERMISSION_MODULES.add(MA_PERMISSION_MODULE);

/** The role whose holders see every meeting in the company (ADMIN always does). */
export const MA_COMPANY_ROLES: Role[] = [ROLES.AI];

export type MaScope = 'MINE' | 'ALL';

/** What a list is confined to: nothing more for the company view, the caller's rows otherwise. */
export type MaScopeFilter = { viewerIds?: string };

/** Who is acting, with the name and email their own account carries. */
export interface MaActor {
  id: string;
  name: string;
  email: string;
}

/**
 * The signed-in person, provided the company has the assistant switched on and lets them use
 * it. Every Meeting Assistant operation starts here, the extension's included.
 */
export async function assertMaUser(ctx: GraphQLContext): Promise<MaActor> {
  const user = assertAuthenticated(ctx);
  const settings = await getMaSettings();
  if (!settings.enabled) {
    forbidden('The Meeting Assistant is switched off for your company.');
  }
  const allowed = settings.allowedUserIds;
  if (allowed.length > 0 && !allowed.includes(user.id)) {
    forbidden('The Meeting Assistant is not enabled for your account.');
  }
  const account = await UserModel.findById(user.id).select('name email').lean();
  return { id: user.id, name: account?.name ?? user.email, email: account?.email ?? user.email };
}

/** Whether the caller reads the whole company's meetings (AI role or ADMIN, via the matrix). */
export function seesCompany(ctx: GraphQLContext): Promise<boolean> {
  const roles = ctx.user?.roles ?? [];
  if (
    ctx.user?.esid ||
    !roles.some((role) => role === ROLES.ADMIN || MA_COMPANY_ROLES.includes(role))
  ) {
    return Promise.resolve(false);
  }
  return isAllowed(roles, MA_PERMISSION_MODULE, 'VIEW');
}

/**
 * The filter a list is confined to. ALL needs the company view and is refused otherwise;
 * MINE is everything the caller may read without it: meetings they own or were matched to.
 */
export async function scopeFilter(
  ctx: GraphQLContext,
  actor: MaActor,
  scope: MaScope | null | undefined,
): Promise<MaScopeFilter> {
  if (scope === 'ALL') {
    await assertPermission(ctx, MA_PERMISSION_MODULE, MA_COMPANY_ROLES, 'VIEW');
    return {};
  }
  return { viewerIds: actor.id };
}

/** Company-wide changes: settings and anybody's meeting. */
export function assertCompanyEditor(ctx: GraphQLContext) {
  return assertPermission(ctx, MA_PERMISSION_MODULE, MA_COMPANY_ROLES, 'EDIT');
}

/** Reading the company's settings: a company viewer, or else a company editor. */
export async function assertSettingsReader(ctx: GraphQLContext): Promise<void> {
  await assertMaUser(ctx);
  if (!(await seesCompany(ctx))) {
    await assertCompanyEditor(ctx);
  }
}

type LeanMeeting = MaMeetingDocument & { _id: unknown };

/** A meeting the caller may read, or not-found (never "forbidden": that would confirm it exists). */
export async function readableMeeting(
  ctx: GraphQLContext,
  actor: MaActor,
  meetingId: string,
): Promise<LeanMeeting> {
  const meeting = await MaMeetingModel.findById(meetingId).lean<LeanMeeting>();
  if (!meeting) {
    notFound('Meeting');
  }
  if (meeting.viewerIds.includes(actor.id) || (await seesCompany(ctx))) {
    return meeting;
  }
  notFound('Meeting');
}

/** A meeting the caller may change: their own, or any for a company editor. */
export async function editableMeeting(
  ctx: GraphQLContext,
  actor: MaActor,
  meetingId: string,
): Promise<LeanMeeting> {
  const meeting = await readableMeeting(ctx, actor, meetingId);
  if (meeting.ownerId !== actor.id) {
    await assertCompanyEditor(ctx);
  }
  return meeting;
}

/** The extension may only act on the caller's OWN live session rows. */
export async function ownedMeeting(actor: MaActor, meetingId: string): Promise<LeanMeeting> {
  const meeting = await MaMeetingModel.findOne({
    _id: meetingId,
    ownerId: actor.id,
  }).lean<LeanMeeting>();
  if (!meeting) {
    notFound('Meeting');
  }
  return meeting;
}
