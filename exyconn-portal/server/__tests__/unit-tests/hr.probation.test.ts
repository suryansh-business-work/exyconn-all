import { hrResolvers } from '../../src/modules/hr';
import { UserModel } from '../../src/modules/admin/user.model';
import { ROLES } from '../../src/constants/roles';
import { seedUser } from '../helpers';
import type { GraphQLContext } from '../../src/middleware/auth';

type Resolver = (p: unknown, a: never, c: GraphQLContext) => Promise<Array<{ name: string }>>;
const probationsEnding = hrResolvers.Query.probationsEnding as unknown as Resolver;

const hr = { user: { id: 'hr', email: 'hr@exyconn.com', roles: [ROLES.HR] } } as GraphQLContext;
const emp = { user: { id: 'e', email: 'e@exyconn.com', roles: [ROLES.EMPLOYEE] } } as GraphQLContext;

const DAY = 24 * 60 * 60 * 1000;
const inDays = (days: number) => new Date(Date.now() + days * DAY);

async function employee(email: string, fields: Record<string, unknown>) {
  const user = await seedUser(email, 'whatever123', [ROLES.EMPLOYEE]);
  await UserModel.updateOne({ _id: user._id }, fields);
  return String(user._id);
}

const ending = (days?: number) =>
  probationsEnding(null, (days === undefined ? {} : { days }) as never, hr);

describe('probationsEnding', () => {
  it('lists the people whose probation ends inside the window, soonest first', async () => {
    await employee('late@exyconn.com', { name: 'Late', probationEndDate: inDays(20) });
    await employee('soon@exyconn.com', { name: 'Soon', probationEndDate: inDays(3) });

    expect((await ending()).map((row) => row.name)).toEqual(['Soon', 'Late']);
  });

  it('leaves out anybody outside the window, in either direction', async () => {
    await employee('past@exyconn.com', { name: 'Past', probationEndDate: inDays(-5) });
    await employee('far@exyconn.com', { name: 'Far', probationEndDate: inDays(60) });
    await employee('permanent@exyconn.com', { name: 'Permanent', probationEndDate: null });

    expect(await ending()).toEqual([]);
  });

  it('honours a window the caller asks for', async () => {
    await employee('far@exyconn.com', { name: 'Far', probationEndDate: inDays(45) });

    expect(await ending(30)).toEqual([]);
    expect((await ending(90)).map((row) => row.name)).toEqual(['Far']);
  });

  it('leaves out a deactivated account — their probation is nobody’s decision now', async () => {
    await employee('gone@exyconn.com', {
      name: 'Gone',
      probationEndDate: inDays(5),
      isActive: false,
    });

    expect(await ending()).toEqual([]);
  });

  it('refuses a plain employee', async () => {
    await expect(probationsEnding(null, {} as never, emp)).rejects.toThrow();
  });
});
