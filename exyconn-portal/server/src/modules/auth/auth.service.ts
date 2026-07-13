import { UserModel } from '../admin/user.model';
import { verifyPassword, hashPassword } from '../../utils/password';
import { signToken } from '../../utils/jwt';
import { unauthenticated, badRequest, notFound } from '../../utils/errors';
import { imageUploader } from '../../utils/imagekit';
import type { Role } from '../../constants/roles';

export interface UpdateProfileInput {
  name?: string;
  avatarUrl?: string;
}

/** Authentication logic (singleton). */
class AuthService {
  async login(email: string, password: string) {
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user || !user.isActive) unauthenticated('Invalid email or password');
    if (user.isBlocked)
      unauthenticated('Your account is temporarily blocked. Contact an administrator.');
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) unauthenticated('Invalid email or password');

    const token = signToken({
      id: user.id,
      email: user.email,
      roles: user.roles as Role[],
    });
    return { token, user: user.toObject() };
  }

  async me(id: string) {
    const user = await UserModel.findById(id).lean();
    if (!user) unauthenticated();
    return user;
  }

  async updateProfile(id: string, input: UpdateProfileInput) {
    const update: Record<string, unknown> = {};
    if (input.name !== undefined) update.name = input.name;
    if (input.avatarUrl !== undefined) update.avatarUrl = input.avatarUrl;
    const user = await UserModel.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!user) notFound('User');
    return user;
  }

  async changePassword(id: string, currentPassword: string, newPassword: string) {
    if (newPassword.length < 6) badRequest('New password must be at least 6 characters');
    const user = await UserModel.findById(id);
    if (!user) notFound('User');
    const ok = await verifyPassword(currentPassword, user.passwordHash);
    if (!ok) badRequest('Current password is incorrect');
    user.passwordHash = await hashPassword(newPassword);
    await user.save();
    return true;
  }

  async uploadAvatar(id: string, file: string) {
    const url = await imageUploader.uploadAvatar(file, `avatar-${id}`);
    await UserModel.findByIdAndUpdate(id, { avatarUrl: url });
    return url;
  }
}

export const authService = new AuthService();
