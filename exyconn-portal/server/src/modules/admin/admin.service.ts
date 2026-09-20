import { isValidObjectId } from 'mongoose';
import { UserModel } from './user.model';
import { AppSettingsModel } from './settings.model';
import { OrganizationModel } from '../organizations/organization.model';
import { currentOrganizationId, runAsPlatform } from '../../lib/tenant';
import { assertPasswordPolicy, hashPassword, generateTempPassword } from '../../utils/password';
import { bumpTokenVersion } from '../auth/auth.service';
import { notFound, badRequest, forbidden } from '../../utils/errors';
import {
  EmploymentTypeModel,
  GradeModel,
  LocationModel,
  ShiftModel,
  TeamModel,
} from '../orgmaster/orgmaster.models';
import { mailer } from '../../utils/mailer';
import { logger } from '../../utils/logger';
import {
  tableQuery,
  tableStats,
  type StatsConfig,
  type TableConfig,
  type TableQueryInput,
} from '../../utils/tableQuery';
import { ORGANIZATION_ROLES, ROLES, type Role } from '../../constants/roles';
import { isValidTimezone } from '../../utils/timezone';
import { isValidCountry } from '../../utils/iso';
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

/** Who is changing an account: enough to tell a platform administrator from a company's staff. */
export interface AccountActor {
  id?: string;
  roles: readonly string[];
  organizationId?: string | null;
}

/** The account being changed, as it is stored now. */
export interface AccountTarget {
  id?: string;
  roles: readonly string[];
  email?: string;
  isActive?: boolean;
}

/**
 * The roles HR may hand out or take away. Ordinary department access only: nothing that
 * administers the company (ADMIN, HR), holds its money (FINANCE), runs its systems (TECH) or
 * watches everybody's screen (TRACKER) — and never the platform's own SUPER_ADMIN.
 */
export const HR_GRANTABLE_ROLES: ReadonlySet<string> = new Set<Role>([
  ROLES.EMPLOYEE,
  ROLES.SUPPORT,
  ROLES.CRM,
  ROLES.PRODUCTS,
  ROLES.LEGAL,
  ROLES.MARKETING,
  ROLES.PROJECTS,
  ROLES.IT,
  ROLES.COMPLIANCE,
]);

const COMPANY_ROLES: ReadonlySet<string> = new Set(ORGANIZATION_ROLES);

/** A platform administrator standing above the companies: SUPER_ADMIN with no organization. */
export function isPlatformActor(actor: AccountActor): boolean {
  return actor.roles.includes(ROLES.SUPER_ADMIN) && (actor.organizationId ?? null) === null;
}

/** Roles in one list and not the other, in either direction. */
function changedRoles(roles: readonly string[], targetRoles: readonly string[]): string[] {
  const added = roles.filter((role) => !targetRoles.includes(role));
  const removed = targetRoles.filter((role) => !roles.includes(role));
  return [...added, ...removed];
}

/**
 * Refuses a company's staff touching a platform administrator's account: resetting its
 * password or email from inside a company would be a way to take over the platform.
 */
export function assertMayManageAccount(actor: AccountActor, target: AccountTarget): void {
  if (isPlatformActor(actor) || (actor.id !== undefined && actor.id === target.id)) {
    return;
  }
  if (target.roles.includes(ROLES.SUPER_ADMIN)) {
    forbidden('Only a platform administrator can change a platform administrator’s account.');
  }
}

/**
 * Who may grant which roles.
 *
 * A company grants only company roles: SUPER_ADMIN is the platform's, and no path inside a
 * company can mint one — only a platform administrator (SUPER_ADMIN with no organization) can.
 * Inside a company an ADMIN may grant any company role. HR creates and edits employees — that
 * is what makes one shared user database real — but "create a user" and "make somebody an
 * administrator" are different powers, so HR adds or removes only the ordinary department
 * roles in HR_GRANTABLE_ROLES, never its own, and may not touch an administrator at all.
 */
export function assertMayAssignRoles(
  actor: AccountActor,
  roles: readonly string[] | undefined,
  target: AccountTarget = { roles: [] },
): void {
  if (isPlatformActor(actor)) {
    return;
  }
  const changed = changedRoles(roles ?? target.roles, target.roles);
  if (changed.some((role) => !COMPANY_ROLES.has(role))) {
    forbidden('Only a platform administrator can grant or remove SUPER_ADMIN.');
  }
  if (actor.roles.includes(ROLES.ADMIN)) {
    return;
  }
  if (target.roles.includes(ROLES.ADMIN)) {
    forbidden('Only an administrator can change an administrator’s account.');
  }
  if (changed.includes(ROLES.ADMIN)) {
    forbidden('Only an administrator can grant the ADMIN role.');
  }
  if (changed.length > 0 && actor.id !== undefined && actor.id === target.id) {
    forbidden('You cannot change your own roles.');
  }
  const privileged = changed.filter((role) => !HR_GRANTABLE_ROLES.has(role));
  if (privileged.length > 0) {
    forbidden(`Only an administrator can grant or remove ${privileged.join(', ')}.`);
  }
}

/**
 * The sign-in fields of an account — password, email, whether it is active — are an
 * administrator's alone. HR edits the employee record; changing somebody's email or password
 * would let HR sign in as them. An unchanged value (a form sending back what it loaded) passes.
 */
export function assertMayChangeSignInFields(
  actor: AccountActor,
  input: Pick<UpdateUserInput, 'email' | 'password' | 'isActive'>,
  target: AccountTarget,
): void {
  if (isPlatformActor(actor) || actor.roles.includes(ROLES.ADMIN)) {
    return;
  }
  const emailChanged =
    input.email !== undefined &&
    input.email.trim().toLowerCase() !== (target.email ?? '').toLowerCase();
  const activeChanged = input.isActive !== undefined && input.isActive !== target.isActive;
  if (input.password || emailChanged || activeChanged) {
    forbidden('Only an administrator can change a person’s email, password or active status.');
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
  /** Office or site, by the location master's code. Empty clears it. */
  locationCode?: string;
  /** Team inside the department, by name. Empty clears it. */
  teamName?: string;
  /** Job grade, by the grade master's code. Empty clears it. */
  gradeCode?: string;
  /** Kind of employment, by the employment-type master's code. Empty clears it. */
  employmentTypeCode?: string;
  /** Working-hours pattern, by the shift master's code. Empty clears it. */
  shiftCode?: string;
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
  /** ISO 3166-1 alpha-2. Null (or omitted) follows the company's country. */
  country?: string | null;
  /** The state or region they work in. Null (or empty) is none. */
  region?: string | null;
  /** The city they work in. Null (or empty) is none. */
  city?: string | null;
}

/**
 * A person's chosen zone/language/country/region/city as it goes onto their record.
 *
 * Empty means "follow the workspace default" and is stored as null, never as a copy of the
 * current default — an admin moving the house timezone should move everybody who never
 * expressed a preference. Anything non-empty has to resolve: a typo'd zone would silently
 * put every timestamp this person sees in the wrong place, so it is refused out loud.
 */
function localeFields(input: HrFields) {
  const timezone = input.timezone?.trim() ?? '';
  const locale = input.locale?.trim() ?? '';
  const country = input.country?.trim().toUpperCase() ?? '';
  const region = input.region?.trim() ?? '';
  const city = input.city?.trim() ?? '';
  if (timezone !== '' && !isValidTimezone(timezone)) {
    badRequest(`"${timezone}" is not a timezone this system knows.`);
  }
  if (locale !== '' && !isValidLocale(locale)) {
    badRequest(`"${locale}" is not a language tag this system knows.`);
  }
  if (country !== '' && !isValidCountry(country)) {
    badRequest(`"${country}" is not an ISO 3166-1 country code.`);
  }
  return {
    timezone: timezone === '' ? null : timezone,
    locale: locale === '' ? null : (canonicalLocale(locale) ?? null),
    country: country === '' ? null : country,
    region: region === '' ? null : region,
    city: city === '' ? null : city,
  };
}

/**
 * The master data a person is placed in, checked against the masters themselves.
 *
 * Refused rather than stored loose: a shift code with a typo would read as "no shift" on
 * every screen that joins them, which looks exactly like a person nobody has got round to
 * placing. The masters are small and this runs on a form submit, so five lookups is the
 * cheapest possible way to be sure.
 */
async function placementFields(input: HrFields) {
  const asked = {
    locationCode: input.locationCode?.trim().toUpperCase() ?? '',
    teamName: input.teamName?.trim() ?? '',
    gradeCode: input.gradeCode?.trim().toUpperCase() ?? '',
    employmentTypeCode: input.employmentTypeCode?.trim().toUpperCase() ?? '',
    shiftCode: input.shiftCode?.trim().toUpperCase() ?? '',
  };
  const checks: [string, string, () => Promise<unknown>][] = [
    ['location', asked.locationCode, () => LocationModel.exists({ code: asked.locationCode })],
    ['team', asked.teamName, () => TeamModel.exists({ name: asked.teamName })],
    ['grade', asked.gradeCode, () => GradeModel.exists({ code: asked.gradeCode })],
    [
      'employment type',
      asked.employmentTypeCode,
      () => EmploymentTypeModel.exists({ code: asked.employmentTypeCode }),
    ],
    ['shift', asked.shiftCode, () => ShiftModel.exists({ code: asked.shiftCode })],
  ];
  for (const [what, value, exists] of checks) {
    if (value !== '' && !(await exists())) {
      badRequest(`There is no ${what} "${value}". Add it to the master list first.`);
    }
  }
  return asked;
}

/** The HR fields, as they go onto a new user document. */
async function hrFields(input: HrFields) {
  return {
    department: input.department,
    designation: input.designation,
    ...(await placementFields(input)),
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

  /**
   * Active employees — the picker projection every portal may read: who they are and where
   * they sit (so a form can offer "everyone in Engineering"), nothing from the HR record.
   */
  listEmployeeOptions() {
    return UserModel.find({ isActive: true })
      .select('name email designation department')
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
      ...(await hrFields(input)),
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
    // The placement codes are checked against the masters here too: an update is the path
    // most likely to carry one, since a joiner is usually placed after the account exists.
    const update: Record<string, unknown> = {
      ...input,
      ...localeFields(input),
      ...(await placementFields(input)),
    };
    delete update.password;
    if (input.password) {
      const current = await UserModel.findById(id).select('email').lean();
      assertPasswordPolicy(input.password, input.email ?? current?.email ?? '');
      update.passwordHash = await hashPassword(input.password);
    }
    const user = await UserModel.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!user) notFound('User');
    // A password set by an administrator signs the person out everywhere they were signed in.
    if (input.password) await bumpTokenVersion(id);
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
    // Whoever held the old password — or a session opened with it — is signed out now.
    await bumpTokenVersion(id);
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

  /**
   * The workspace's formats, with the company's own profile alongside them: the money it keeps
   * books in, the country it operates in, when its financial year opens and whose tax rules its
   * paperwork follows.
   *
   * They arrive together because every screen already reads these settings, and a second query
   * for "which currency is this?" would be one more thing to forget on a screen showing money.
   */
  async getSettings() {
    const settings = await this.readOrCreateSettings();
    const organizationId = currentOrganizationId();
    if (organizationId === null) {
      return settings;
    }
    const organization = await runAsPlatform(() =>
      OrganizationModel.findById(organizationId)
        .select('currency country fiscalYearStartMonth taxSystem')
        .lean(),
    );
    return {
      ...settings,
      currency: organization?.currency ?? '',
      country: organization?.country ?? '',
      fiscalYearStartMonth: organization?.fiscalYearStartMonth ?? 1,
      taxSystem: organization?.taxSystem ?? 'NONE',
    };
  }

  private async readOrCreateSettings() {
    // Not lean: a record older than a field (defaultLocale, enabledLocales) must still read with
    // the schema default, or the non-null GraphQL field fails the whole query.
    const existing = await AppSettingsModel.findOne({ key: 'global' });
    if (existing) return existing.toObject();
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
