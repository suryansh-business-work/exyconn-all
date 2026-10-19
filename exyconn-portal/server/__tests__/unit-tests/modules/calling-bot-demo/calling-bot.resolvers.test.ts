import { Types } from 'mongoose';
import { callingBotResolvers } from '../../../../src/modules/calling-bot-demo/calling-bot.resolvers';
import { callingBotCalls } from '../../../../src/modules/calling-bot-demo/calling-bot.calls.service';
import { callingBotConfigs } from '../../../../src/modules/calling-bot-demo/calling-bot.config.service';
import { callingBotScenarios } from '../../../../src/modules/calling-bot-demo/calling-bot.scenarios.service';
import { SCENARIO_FLOWS } from '../../../../src/modules/calling-bot-demo/calling-bot.flows.seed';
import { AuditLogModel } from '../../../../src/modules/audit';
import { invalidatePlatformOperatorCache } from '../../../../src/lib/platformAccess';
import { ROLES } from '../../../../src/constants/roles';
import { openAiClient } from '../../../../src/utils/openai';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { seedUser } from '../../../helpers';
import {
  configInput,
  credential,
  jsonResponse,
  mockFetch,
  scenarioInput,
  twilioFields,
} from './callingBot.fixtures';

const { Query, Mutation } = callingBotResolvers;

/** A platform administrator: a SUPER_ADMIN standing above the companies. */
const tech: GraphQLContext = {
  user: { id: new Types.ObjectId().toHexString(), roles: [ROLES.SUPER_ADMIN], email: 'sa@x.io' },
};
/** A TECH user of an ordinary company, which does not operate the platform. */
const outsider: GraphQLContext = {
  user: {
    id: new Types.ObjectId().toHexString(),
    roles: [ROLES.TECH],
    email: 'tech@customer.io',
    organizationId: new Types.ObjectId().toHexString(),
  },
};
const visitor: GraphQLContext = {
  user: null,
  demoVisitor: {
    id: 'v1',
    name: 'Asha',
    email: 'asha@example.com',
    phone: '',
    company: 'Acme',
    organizationId: new Types.ObjectId().toHexString(),
  },
};

const lastAudit = () => AuditLogModel.findOne().sort({ _id: -1 }).lean();

beforeEach(() => invalidatePlatformOperatorCache());
afterEach(() => jest.restoreAllMocks());

describe('field resolvers', () => {
  it('say which keys are stored without returning them', async () => {
    const row = await callingBotConfigs.create(configInput(twilioFields()));
    const f = callingBotResolvers.CallingBotConfig;
    expect(f.hasSarvamApiKey(row)).toBe(true);
    expect(f.sarvamApiKeyHint(row)).not.toContain(row.sarvamApiKey);
    expect(f.hasOpenAiApiKey(row)).toBe(true);
    expect(f.openAiApiKeyHint(row)).not.toContain(row.openAiApiKey);
    expect(f.hasVobizAuthToken(row)).toBe(false);
    expect(f.hasTwilioAuthToken(row)).toBe(true);
    expect(f.phoneEnabled(row)).toBe(true);
  });

  it('give old calls and examples the empty values GraphQL expects', async () => {
    const { scenarioTitle } = callingBotResolvers.CallingBotCall;
    expect(scenarioTitle(asCall(''))).toBeNull();
    expect(scenarioTitle(asCall('Clinic'))).toBe('Clinic');
    const old = await callingBotScenarios.create(scenarioInput());
    const { flow, callScript } = callingBotResolvers.CallingBotScenario;
    const bare = { ...old, flow: undefined, callScript: undefined };
    expect(flow(bare)).toBeNull();
    expect(callScript(bare)).toBe('');
    const drawn = { ...old, flow: SCENARIO_FLOWS['order-status'], callScript: 'Say hi' };
    expect(flow(drawn)).toEqual(SCENARIO_FLOWS['order-status']);
    expect(callScript(drawn)).toBe('Say hi');
  });
});

/** A call row with only the title set, for the field resolver. */
function asCall(scenarioTitle: string) {
  return {
    _id: 'c1',
    channel: 'BROWSER' as const,
    status: 'ENDED' as const,
    callerId: 'u',
    callerName: '',
    callerEmail: '',
    phone: '',
    languageCode: 'en-IN',
    scenarioTitle,
    providerCallId: '',
    answeredAt: null,
    endedAt: null,
    endReason: '',
    transcript: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('Tech guard', () => {
  it('keeps every settings operation from a company that does not operate the platform', async () => {
    const refused = 'Only the platform operator may manage this.';
    await expect(Query.callingBotConfigs({}, {}, outsider)).rejects.toThrow(refused);
    await expect(Query.callingBotScenarios({}, {}, outsider)).rejects.toThrow(refused);
    await expect(Query.callingBotRecentCalls({}, {}, outsider)).rejects.toThrow(refused);
    await expect(
      Mutation.createCallingBotConfig({}, { input: configInput() }, outsider),
    ).rejects.toThrow(refused);
    await expect(
      Mutation.testCallingBotKey({}, { input: { key: 'OPENAI' } }, outsider),
    ).rejects.toThrow(refused);
  });
});

describe('config mutations', () => {
  it('create, update, list, reveal and delete a config, auditing each change', async () => {
    const created = await Mutation.createCallingBotConfig({}, { input: configInput() }, tech);
    expect(created.id).toBe(String(created._id));
    expect((await lastAudit())?.summary).toBe('Added the calling bot config Primary');

    const updated = await Mutation.updateCallingBotConfig(
      {},
      { id: created.id, input: configInput({ label: 'Main', sarvamApiKey: '' }) },
      tech,
    );
    expect(updated).toMatchObject({ id: created.id, label: 'Main' });
    expect(await lastAudit()).toMatchObject({
      action: 'UPDATE',
      module: 'TechConfig',
      entityId: created.id,
      summary: 'Updated the calling bot config Main',
    });

    expect((await Query.callingBotConfigs({}, {}, tech)).map((c) => c.id)).toEqual([created.id]);

    await expect(
      Mutation.revealCallingBotSecret({}, { id: created.id, secret: 'SARVAM_API_KEY' }, tech),
    ).resolves.toBe(credential('sarvam'));
    expect(await lastAudit()).toMatchObject({
      action: 'ACCESS',
      summary: 'Revealed the Sarvam AI key of the calling bot config Main',
    });

    await expect(Mutation.deleteCallingBotConfig({}, { id: created.id }, tech)).resolves.toBe(true);
    expect((await lastAudit())?.summary).toBe('Deleted the calling bot config Main');
  });

  it('tests a key from the form and a saved config', async () => {
    const created = await callingBotConfigs.create(configInput());
    jest.spyOn(openAiClient, 'verify').mockResolvedValue();
    mockFetch().mockResolvedValue(jsonResponse({}));
    await expect(
      Mutation.testCallingBotKey(
        {},
        { input: { key: 'OPENAI', configId: String(created._id) } },
        tech,
      ),
    ).resolves.toBe('OpenAI accepted the key and can use gpt-4o-mini.');
    await expect(
      Mutation.testCallingBotConfig({}, { id: String(created._id) }, tech),
    ).resolves.toBe(true);
  });
});

describe('scenario mutations', () => {
  it('create, update, save a flow for and delete an example, auditing each change', async () => {
    const created = await Mutation.createCallingBotScenario({}, { input: scenarioInput() }, tech);
    expect((await lastAudit())?.summary).toBe('Added the calling bot example Clinic booking');

    const updated = await Mutation.updateCallingBotScenario(
      {},
      { id: created.id, input: scenarioInput({ title: 'Dentist' }) },
      tech,
    );
    expect(updated.title).toBe('Dentist');
    expect((await lastAudit())?.summary).toBe('Updated the calling bot example Dentist');

    const flow = SCENARIO_FLOWS['clinic-appointment'];
    const saved = await Mutation.saveCallingBotScenarioFlow({}, { id: created.id, flow }, tech);
    expect(saved.flow).toEqual(flow);
    expect((await lastAudit())?.summary).toBe(
      'Saved the call flow of the calling bot example Dentist',
    );

    expect((await Query.callingBotScenarios({}, {}, tech)).map((s) => s.id)).toEqual([
      created.id,
    ]);
    await expect(Mutation.deleteCallingBotScenario({}, { id: created.id }, tech)).resolves.toBe(
      true,
    );
    expect(await lastAudit()).toMatchObject({
      action: 'DELETE',
      summary: 'Deleted the calling bot example Dentist',
    });
  });
});

describe('calls', () => {
  it('lets a demo visitor see availability, the examples and start a browser call', async () => {
    await callingBotConfigs.create(configInput({ isActive: true }));
    await callingBotScenarios.create(scenarioInput());
    await expect(Query.callingBotAvailability({}, {}, visitor)).resolves.toMatchObject({
      available: true,
    });
    const options = await Query.callingBotScenarioOptions({}, {}, visitor);
    expect(options.map((o) => o.title)).toEqual(['Clinic booking']);

    const { call, socketUrl } = await Mutation.startCallingBotCall(
      {},
      { input: { channel: 'BROWSER', scenarioId: options[0].id } },
      visitor,
    );
    expect(call).toMatchObject({ callerId: 'visitor:v1', callerName: 'Asha' });
    expect(call.id).toBe(String(call._id));
    expect(socketUrl).toContain('/browser?ticket=');

    const own = await Query.callingBotCall({}, { id: call.id }, visitor);
    expect(own.id).toBe(call.id);
    expect(own.scenarioTitle).toBe('Clinic booking');
  });

  it('calls a signed-in employee by their account name', async () => {
    await callingBotConfigs.create(configInput({ isActive: true }));
    const user = await seedUser('ravi@exyconn.com', credential('pw'), [ROLES.EMPLOYEE]);
    const ctx: GraphQLContext = {
      user: { id: user.id, roles: [ROLES.EMPLOYEE], email: 'ravi@exyconn.com' },
      demoVisitor: visitor.demoVisitor,
    };
    const { call } = await Mutation.startCallingBotCall({}, { input: { channel: 'BROWSER' } }, ctx);
    expect(call).toMatchObject({ callerId: user.id, callerName: 'ravi', callerEmail: 'ravi@exyconn.com' });
  });

  it('refuses a caller who is neither a visitor nor signed in', async () => {
    await expect(Query.callingBotAvailability({}, {}, { user: null })).rejects.toThrow();
    await expect(Query.callingBotScenarioOptions({}, {}, { user: null })).rejects.toThrow();
  });

  it('lists recent calls for Tech, 50 by default and never more than 200', async () => {
    await callingBotConfigs.create(configInput({ isActive: true }));
    await Mutation.startCallingBotCall({}, { input: { channel: 'BROWSER' } }, visitor);
    const recent = jest.spyOn(callingBotCalls, 'recent');
    const all = await Query.callingBotRecentCalls({}, {}, tech);
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(String(all[0]._id));
    await Query.callingBotRecentCalls({}, { limit: 5 }, tech);
    await Query.callingBotRecentCalls({}, { limit: 500 }, tech);
    expect(recent.mock.calls).toEqual([[50], [5], [200]]);
  });
});
