import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import type { GraphQLError } from 'graphql';
import { actorNameOf } from '../../../src/lib/actor';
import { UserModel } from '../../../src/modules/admin/user.model';
import { ROLES } from '../../../src/constants/roles';
import type { GraphQLContext } from '../../../src/middleware/auth';

const ctxFor = (id: string, email = 'caller@example.com'): GraphQLContext => ({
  user: { id, email, roles: [ROLES.EMPLOYEE] },
});

describe('actorNameOf', () => {
  it('refuses a request nobody is signed in to', async () => {
    const refusal = await actorNameOf({ user: null }).catch((error: unknown) => error);
    expect((refusal as GraphQLError).extensions?.code).toBe('UNAUTHENTICATED');
  });

  it('reads the display name from the account, not from the token', async () => {
    const user = await UserModel.create({
      name: 'Grace Hopper',
      email: 'grace@example.com',
      passwordHash: randomUUID(),
      roles: [ROLES.EMPLOYEE],
    });
    await expect(actorNameOf(ctxFor(String(user._id), 'token@example.com'))).resolves.toBe(
      'Grace Hopper',
    );
  });

  it('falls back to the token email when the account is gone', async () => {
    const missing = String(new Types.ObjectId());
    await expect(actorNameOf(ctxFor(missing, 'gone@example.com'))).resolves.toBe(
      'gone@example.com',
    );
  });

  it('says nothing rather than undefined when there is no email either', async () => {
    const ctx = {
      user: { id: String(new Types.ObjectId()), roles: [] },
    } as unknown as GraphQLContext;
    await expect(actorNameOf(ctx)).resolves.toBe('');
  });
});
