import { Types } from 'mongoose';
import {
  agentsResolvers,
  agentsTypeDefs,
  AGENTS_MODULE,
  AGENTS_ROLES,
  assertAgentStaff,
} from '../../../../src/modules/agents';
import { invalidatePlatformOperatorCache } from '../../../../src/lib/platformAccess';
import { runAsPlatform } from '../../../../src/lib/tenant';
import { ROLES, type Role } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { useChatOperator } from '../website-chat/chat.fixtures';

const operatorId = useChatOperator();

const { agentsOverview } = agentsResolvers.Query;

const caller = (roles: Role[], organizationId?: string): GraphQLContext => ({
  user: {
    id: new Types.ObjectId().toHexString(),
    roles,
    email: 'someone@x.io',
    ...(organizationId ? { organizationId } : {}),
  },
});

beforeEach(() => invalidatePlatformOperatorCache());

describe('the Agents console guard', () => {
  it('is governed by its own module, for the Agents team and Tech staff', () => {
    expect(AGENTS_MODULE).toBe('AgentConsole');
    expect(AGENTS_ROLES).toEqual([ROLES.AGENTS, ROLES.TECH]);
  });

  it('hands back the caller it let through, and refuses an editor outside the operator', async () => {
    const agent = caller([ROLES.AGENTS], operatorId);
    expect(await assertAgentStaff(agent, 'EDIT')).toBe(agent.user);
    await expect(
      assertAgentStaff(caller([ROLES.TECH], new Types.ObjectId().toHexString()), 'EDIT'),
    ).rejects.toThrow('Only the platform operator may manage this.');
  });

  it('declares the overview query with its days argument', () => {
    const body = agentsTypeDefs.loc?.source.body ?? '';
    expect(body).toMatch(/"Reads the Agents console's overview[^"]*"\s+agentsOverview\(/);
    expect(body).toContain('days: Int');
  });
});

describe('agentsOverview', () => {
  it('gives the platform operator’s Agents team the overview, 30 days when none are asked for', async () => {
    const overview = await agentsOverview(undefined, {}, caller([ROLES.AGENTS], operatorId));
    expect(overview.days).toBe(30);
    expect(overview.conversations).toBe(0);
  });

  it('lets Tech staff and a platform SUPER_ADMIN read it, with the days they ask for kept in range', async () => {
    expect(
      (await agentsOverview(undefined, { days: 7 }, caller([ROLES.TECH], operatorId))).days,
    ).toBe(7);
    // A platform SUPER_ADMIN stands above the companies: no organization in the token or scope.
    const admin = await runAsPlatform(() =>
      agentsOverview(undefined, { days: 900 }, caller([ROLES.SUPER_ADMIN])),
    );
    expect(admin.days).toBe(365);
  });

  it('refuses an Agents user of a customer company', async () => {
    const outsider = caller([ROLES.AGENTS], new Types.ObjectId().toHexString());
    await expect(agentsOverview(undefined, {}, outsider)).rejects.toThrow(
      'Only the platform operator may manage this.',
    );
  });

  it('refuses operator staff without an Agents or Tech role, and anyone signed out', async () => {
    await expect(
      agentsOverview(undefined, {}, caller([ROLES.EMPLOYEE, ROLES.HR], operatorId)),
    ).rejects.toThrow();
    await expect(agentsOverview(undefined, {}, { user: null })).rejects.toThrow();
  });
});
