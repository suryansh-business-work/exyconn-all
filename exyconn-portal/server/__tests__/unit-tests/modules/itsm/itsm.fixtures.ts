import { UserModel } from '../../../../src/modules/admin/user.model';
import { itsmResolvers } from '../../../../src/modules/itsm';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';

/** A resolver as the tests call it: loose arguments, a settled value to inspect. */
export type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<never>;

export const itQuery = itsmResolvers.Query as unknown as Record<string, Resolver>;
export const itMutation = itsmResolvers.Mutation as unknown as Record<string, Resolver>;

export const DAY = 86_400_000;
export const HOUR = 3_600_000;

/** The instant `days` from now (negative for the past). */
export const inDays = (days: number) => new Date(Date.now() + days * DAY);

/** A signed-in caller with these roles. */
export const ctxFor = (id: string, roles: string[] = [ROLES.IT]) =>
  ({ user: { id, email: `${id}@exyconn.com`, roles } }) as unknown as GraphQLContext;

/** Nobody signed in. */
export const anonymous = { user: null } as unknown as GraphQLContext;

/** One grid page, the way the client asks for it. */
export const firstPage = { input: { page: 0, pageSize: 25 } };

/** Seeds a user and returns their id. The hash is a placeholder; nobody signs in here. */
export async function person(
  name: string,
  roles: string[] = [ROLES.EMPLOYEE],
  extra: Record<string, unknown> = {},
) {
  const user = await UserModel.create({
    name,
    email: `${name.toLowerCase().replaceAll(' ', '.')}@exyconn.com`,
    passwordHash: 'x',
    roles,
    ...extra,
  });
  return user._id.toHexString();
}

/** Seeds an IT user and returns their id with a context acting as them. */
export async function itStaff(name = 'Ira Tech') {
  const id = await person(name, [ROLES.IT]);
  return { id, ctx: ctxFor(id, [ROLES.IT]) };
}
