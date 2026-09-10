import { isValidObjectId } from 'mongoose';
import { UserModel } from './user.model';
import { AppSettingsModel } from './settings.model';
import { hashPassword, generateTempPassword } from '../../utils/password';
import { notFound, badRequest, forbidden } from '../../utils/errors';
import { mailer } from '../../utils/mailer';
import { logger } from '../../utils/logger';
import {
  tableQuery,
  tableStats,
  type StatsConfig,
  type TableConfig,
  type TableQueryInput,
} from '../../utils/tableQuery';
import { ROLES, type Role } from '../../constants/roles';
import { isValidTimezone } from '../../utils/timezone';
import { canonicalLocale, isValidLocale } from '../i18n/locale.constants';
import type { WorkLocation, WorkingTime } from '../../constants/work';

/** Whitelist of the columns the Users grid may search / filter / sort. */
const USER_TABLE_CONFIG: TableConfig = {
  searchFields: ['name', 'email', 'department', 'designation'],
  filterFields: ['name', 'email', 'department', 'designation', 'employmentStatus'],
  sortFields: [
    'name',
    'email',
    'department',
    'designation',
    'employmentStatus',
    'createdAt',
    'joinDate',
  ],
  defaultSort: { field: 'createdAt', dir: 'DESC' },
};

/** `isActive` -> active/inactive counts; `roles` unwound -> per-role counts (admins, distinct). */
const USER_STATS_CONFIG: StatsConfig = { countBy: ['isActive'], unwindCountBy: ['roles'] };

/**
 * How many links up a reporting chain the cycle guard follows before it gives up.
 *
 * A chain deeper than this is not an organisation, it is a loop written before this guard
 * existed. The bound — with the visited set below — is what stops the walk following such a
 * chain forever and hanging the request that triggered it.
 */
const MAX_REPORTING_DEPTH = 64;

/** Just enough of a user to follow one link of the reporting chain and name whose it is. */
interface ChainLink {
  name: string;
  managerId?: string | null;
}

/**
 * Stops a non-ADMIN from handing out — or taking — the ADMIN role.
 *
 * HR creates and edits employees, which is the whole point of one shared user database. But
 * "create a user" and "make somebody an administrator" are different powers, and the roles
 * field on the form is the only thing between them. An HR user may not mint an admin, and
 * may not touch an existing admin's account at all.
 */
export function assertMayAssignRoles(
  actorRoles: readonly string[],
  roles: readonly string[] | undefined,
  targetRoles: readonly string[] = [],
): void {
  if (actorRoles.includes(ROLES.ADMIN)) {
    return;
  }
  if (targetRoles.includes(ROLES.ADMIN)) {
    forbidden('Only an administrator can change an administrator’s account.');
  }
  if (roles?.includes(ROLES.ADMIN)) {
    forbidden('Only an administrator can grant the ADMIN role.');
  }
}

/**
 * Fire-and-forget, best-effort email: the admin always gets the temp password
 * back to copy and hand over, so a missing/slow/broken SMTP config must neither
 * fail nor delay user creation / password reset. Failures are logged, not thrown,
 * and the SMTP round-trip runs in the background (never awaited by the mutation).
 */
function tryEmail(action: string, send: () => Promise<void>): void {
  const onError = (error: unknown) =>
    logger.error({ error }, `${action} email failed — credentials still available to copy`);
  try {
    // Invoke synchronously, then handle the SMTP round-trip in the background.
    void Promise.resolve(send()).catch(onError);
  } catch (error) {
    onError(error);
  }
}

export interface SendMailInput {
  subject: string;
  message: string;
}

export type EmploymentStatus = 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED';

/** HR fields shared by create/update inputs (all optional). */
export interface HrFields {
  department?: string;
  designation?: string;
  joinDate?: Date;
  dateOfBirth?: Date;
  /** The day they come off probation; null when they are not on one. */
  probationEndDate?: Date | null;
  employmentStatus?: EmploymentStatus;
  /** Profile photo, hosted on ImageKit by the portal's upload dialog. */
  avatarUrl?: string;
  address?: string;
  brief?: string;
  /** Who they report to; null clears it. */
  managerId?: string | null;
  workingTime?: WorkingTime;
  workingTimeNote?: string;
  workLocation?: WorkLocation;
  workLocationNote?: string;
  workHoursPerDay?: number;
  /** IANA zone name. Null (or omitted) follows the workspace default. */
  timezone?: string | null;
  /** BCP-47 tag. Null (or omitted) follows the workspace default. */
  locale?: string | null;
}

/**
 * A person's chosen zone/language as it goes onto their record.
 *
 * Empty means "follow the workspace default" and is stored as null, never as a copy of the
 * current default — an admin moving the house timezone should move everybody who never
 * expressed a preference. Anything non-empty has to resolve: a typo'd zone would silently
 * put every timestamp this person sees in the wrong place, so it is refused out loud.
 */
function localeFields(input: HrFields) {
  const timezone = input.timezone?.trim() ?? '';
  const locale = input.locale?.trim() ?? '';
  if (timezone !== '' && !isValidTimezone(timezone)) {
    badRequest(`"${timezone}" is not a timezone this system knows.`);
  }
  if (locale !== '' && !isValidLocale(locale)) {
    badRequest(`"${locale}" is not a language tag this system knows.`);
  }
  return {
    timezone: timezone === '' ? null : timezone,
    locale: locale === '' ? null : (canonicalLocale(locale) ?? null),
  };
}

/** The HR fields, as they go onto a new user document. */
function hrFields(input: HrFields) {
  return {
    department: input.department,
    designation: input.designation,
    joinDate: input.joinDate,
    dateOfBirth: input.dateOfBirth,
    probationEndDate: input.probationEndDate ?? null,
    employmentStatus: input.employmentStatus ?? 'ACTIVE',
    avatarUrl: input.avatarUrl,
    address: input.address,
    brief: input.brief,
    managerId: input.managerId ?? null,
    workingTime: input.workingTime,
    workingTimeNote: input.workingTimeNote,
    workLocation: input.workLocation,
    workLocationNote: input.workLocationNote,
    workHoursPerDay: input.workHoursPerDay,
    ...localeFields(input),
  };
}

export interface CreateUserInput extends HrFields {
  name: string;
  email: string;
  roles: Role[];
  isActive?: boolean;
}

export interface UpdateUserInput extends HrFields {
  name?: string;
  email?: string;
  password?: string;
  roles?: Role[];
  isActive?: boolean;
}

export interface UpdateSettingsInput {
  dateFormat?: string;
  timeFormat?: string;
  timezone?: string;
  defaultLocale?: string;
  enabledLocales?: string[];
  autoTranslate?: boolean;
}

/** User & portal-settings management (singleton). */
class AdminService {
  listUsers() {
    return UserModel.find().sort({ createdAt: -1 }).lean();
  }

  /** Active employees, name + email only — the picker projection every portal may read. */
  listEmployeeOptions() {
    return UserModel.find({ isActive: true })
      .select('name email designation')
      .sort({ name: 1 })
      .lean();
  }

  /** One page of users for the server-side Users grid (search/filter/sort/paginate). */
  listUsersPaged(input: TableQueryInput) {
    return tableQuery(UserModel, input, USER_TABLE_CONFIG);
  }

  /** Dashboard totals for the Users page (active count, per-role counts) in one aggregation. */
  listUsersStats() {
    return tableStats(UserModel, USER_STATS_CONFIG);
  }

  async getUser(id: string) {
    const user = await UserModel.findById(id).lean();
    if (!user) notFound('User');
    return user;
  }

  async createUser(input: CreateUserInput) {
    if (input.managerId) await this.assertManagerExists(input.managerId);
    const exists = await UserModel.findOne({ email: input.email.toLowerCase() }).lean();
    if (exists) badRequest('A user with this email already exists');
    if (!input.roles.length) badRequest('At least one role is required');

    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);
    const user = await UserModel.create({
      name: input.name,
      email: input.email,
      passwordHash,
      roles: input.roles,
      isActive: input.isActive ?? true,
      ...hrFields(input),
    });

    tryEmail('Welcome', () =>
      mailer.sendWelcomeEmail({
        name: input.name,
        email: user.email,
        password: tempPassword,
        roles: input.roles,
      }),
    );

    // Return the plaintext temp password once so the admin can copy/hand it over
    // (it is never persisted in plaintext — only the hash is stored).
    return { user, password: tempPassword };
  }

  /**
   * A manager must be a real account, never the person themself, and never somebody who
   * already reports to them.
   *
   * The cycle walk only runs on an update, because that is the only path with an employee
   * whose reports already exist — a user being created has none, so nothing can point back
   * at them yet.
   */
  async assertManagerExists(managerId: string, selfId?: string) {
    if (managerId === selfId) badRequest('An employee cannot report to themself');
    const manager = isValidObjectId(managerId)
      ? await UserModel.findById(managerId).select('_id').lean()
      : null;
    if (!manager) badRequest('The selected manager does not exist');
    if (selfId) await this.assertNoReportingCycle(selfId, managerId);
  }

  /**
   * Refuses a manager who already reports to this employee, however far up the chain.
   *
   * `assertManagerExists` catches only the one-step case, so A reports to B reports to C
   * reports to A is accepted without this — and every walk of the reporting line after it
   * (the org chart, a manager's team queues, `directReportIds`) is then walking a loop.
   *
   * The walk climbs from the PROPOSED manager and stops the moment it meets the employee,
   * which is what lets the refusal name the people in the loop rather than say "invalid".
   * It is bounded twice — a visited set and a depth limit — so a cycle already in the
   * database, written before this guard existed, ends the walk instead of spinning on it.
   */
  private async assertNoReportingCycle(employeeId: string, managerId: string): Promise<void> {
    const chain: string[] = [];
    const visited = new Set<string>();
    let current: string | null = managerId;

    for (let step = 0; current && step < MAX_REPORTING_DEPTH; step += 1) {
      if (!isValidObjectId(current) || visited.has(current)) {
        return;
      }
      visited.add(current);
      const link: ChainLink | null = await UserModel.findById(current)
        .select('name managerId')
        .lean();
      if (!link) {
        return;
      }
      chain.push(link.name);
      if (link.managerId === employeeId) {
        await this.refuseReportingCycle(employeeId, chain);
      }
      current = link.managerId ?? null;
    }
  }

  /** The refusal, naming everybody in the loop in the order they report through it. */
  private async refuseReportingCycle(employeeId: string, chain: readonly string[]): Promise<never> {
    const employee = await UserModel.findById(employeeId).select('name').lean();
    const name = employee?.name ?? 'This employee';
    const loop = [name, ...chain, name].join(' → ');
    return badRequest(
      `This would create a reporting loop: ${loop}. Change one of those reporting lines first.`,
    );
  }

  async updateUser(id: string, input: UpdateUserInput) {
    if (input.managerId) await this.assertManagerExists(input.managerId, id);
    const update: Record<string, unknown> = { ...input, ...localeFields(input) };
    delete update.password;
    if (input.password) update.passwordHash = await hashPassword(input.password);
    const user = await UserModel.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!user) notFound('User');
    return user;
  }

  async deleteUser(id: string) {
    const user = await UserModel.findByIdAndDelete(id).lean();
    if (!user) notFound('User');
    return true;
  }

  /** Activates or deactivates a user (deactivated users cannot sign in). */
  async setUserActive(id: string, isActive: boolean) {
    const user = await UserModel.findByIdAndUpdate(id, { isActive }, { new: true }).lean();
    if (!user) notFound('User');
    return user;
  }

  /** Temporarily blocks or unblocks a user, recording the reason when blocking. */
  async setUserBlocked(id: string, isBlocked: boolean, reason?: string) {
    const user = await UserModel.findByIdAndUpdate(
      id,
      { isBlocked, blockReason: isBlocked ? (reason ?? null) : null },
      { new: true },
    ).lean();
    if (!user) notFound('User');
    return user;
  }

  /**
   * Generates a new temporary password, stores its hash, emails it, and returns
   * the plaintext once so the admin can copy/hand it over.
   */
  async resetUserPassword(id: string) {
    const user = await UserModel.findById(id);
    if (!user) notFound('User');
    const tempPassword = generateTempPassword();
    user.passwordHash = await hashPassword(tempPassword);
    await user.save();
    tryEmail('Credentials', () =>
      mailer.sendCredentialsEmail({
        name: user.name,
        email: user.email,
        password: tempPassword,
      }),
    );
    return tempPassword;
  }

  /** Sends an admin-composed custom email to a user, wrapped in the MJML shell. */
  async sendUserMail(id: string, input: SendMailInput) {
    const user = await UserModel.findById(id).lean();
    if (!user) notFound('User');
    await mailer.sendCustomEmail({
      name: user.name,
      email: user.email,
      subject: input.subject,
      message: input.message,
    });
    return true;
  }

  async getSettings() {
    const existing = await AppSettingsModel.findOne({ key: 'global' }).lean();
    if (existing) return existing;
    // A plain object, like the lean read: `withId` spreads its input, which strips a document's fields.
    const created = await AppSettingsModel.create({ key: 'global' });
    return created.toObject();
  }

  /**
   * Saves the workspace's localization defaults.
   *
   * The zone and every language tag are checked here rather than trusted: these are the
   * values every unset person inherits, so one bad tag would put the whole workspace's
   * timestamps — or its entire UI — somewhere nobody asked for.
   */
  async updateSettings(input: UpdateSettingsInput) {
    const update: Record<string, unknown> = { ...input };
    if (input.timezone !== undefined) {
      if (!isValidTimezone(input.timezone)) {
        badRequest(`"${input.timezone}" is not a timezone this system knows.`);
      }
    }
    if (input.defaultLocale !== undefined) {
      const canonical = canonicalLocale(input.defaultLocale);
      if (!canonical) {
        badRequest(`"${input.defaultLocale}" is not a language tag this system knows.`);
      }
      update.defaultLocale = canonical;
    }
    if (input.enabledLocales !== undefined) {
      update.enabledLocales = input.enabledLocales.map((tag) => {
        const canonical = canonicalLocale(tag);
        if (!canonical) {
          badRequest(`"${tag}" is not a language tag this system knows.`);
        }
        return canonical;
      });
    }
    return AppSettingsModel.findOneAndUpdate({ key: 'global' }, update, {
      new: true,
      upsert: true,
    }).lean();
  }
}

export const adminService = new AdminService();
