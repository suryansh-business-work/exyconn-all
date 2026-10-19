import { Types } from 'mongoose';
import { randomBytes } from 'node:crypto';
import { UserModel } from '../../../../../src/modules/admin/user.model';
import { ActivityModel } from '../../../../../src/modules/crm/activity.model';
import { ROLES } from '../../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../../src/middleware/auth';

export const MINUTE = 60_000;

/** A CRM user; the hash is random because nobody signs in as them. */
export async function seedPerson(name: string, isActive = true) {
  const user = await UserModel.create({
    name,
    email: `${name.toLowerCase()}@acme.test`,
    passwordHash: randomBytes(16).toString('hex'),
    roles: [ROLES.CRM],
    isActive,
  });
  return user._id.toHexString();
}

export const asSales: GraphQLContext = {
  user: { id: new Types.ObjectId().toHexString(), roles: [ROLES.CRM], email: 'sales@acme.test' },
};

/** A reminder row as the form would leave it, with anything overridden. */
export const seedReminder = (assigneeId: string, over: Record<string, unknown> = {}) =>
  ActivityModel.create({
    type: 'TASK',
    subject: 'Call back about the renewal',
    owner: 'Asha',
    relatedType: 'CONTACT',
    relatedId: 'contact-1',
    relatedName: 'Ravi',
    remindAt: new Date(Date.now() - MINUTE),
    dueDate: new Date(Date.now() - MINUTE),
    assigneeId,
    assigneeName: 'Asha',
    ...over,
  });
