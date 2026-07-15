import { UserModel } from './user.model';
import { AppSettingsModel } from './settings.model';
import { hashPassword, generateTempPassword } from '../../utils/password';
import { notFound, badRequest } from '../../utils/errors';
import { mailer } from '../../utils/mailer';
import { logger } from '../../utils/logger';
import { tableQuery, type TableConfig, type TableQueryInput } from '../../utils/tableQuery';
import type { Role } from '../../constants/roles';

/** Whitelist of the columns the Users grid may search / filter / sort. */
const USER_TABLE_CONFIG: TableConfig = {
  searchFields: ['name', 'email', 'department', 'designation'],
  filterFields: ['name', 'email', 'department', 'designation', 'employmentStatus'],
  sortFields: ['name', 'email', 'department', 'designation', 'employmentStatus', 'createdAt', 'joinDate'],
  defaultSort: { field: 'createdAt', dir: 'DESC' },
};

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
  employmentStatus?: EmploymentStatus;
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
}

/** User & portal-settings management (singleton). */
class AdminService {
  listUsers() {
    return UserModel.find().sort({ createdAt: -1 }).lean();
  }

  /** One page of users for the server-side Users grid (search/filter/sort/paginate). */
  listUsersPaged(input: TableQueryInput) {
    return tableQuery(UserModel, input, USER_TABLE_CONFIG);
  }

  async getUser(id: string) {
    const user = await UserModel.findById(id).lean();
    if (!user) notFound('User');
    return user;
  }

  async createUser(input: CreateUserInput) {
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
      department: input.department,
      designation: input.designation,
      joinDate: input.joinDate,
      employmentStatus: input.employmentStatus ?? 'ACTIVE',
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

  async updateUser(id: string, input: UpdateUserInput) {
    const update: Record<string, unknown> = { ...input };
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
    return existing ?? AppSettingsModel.create({ key: 'global' });
  }

  async updateSettings(input: UpdateSettingsInput) {
    return AppSettingsModel.findOneAndUpdate({ key: 'global' }, input, {
      new: true,
      upsert: true,
    }).lean();
  }
}

export const adminService = new AdminService();
