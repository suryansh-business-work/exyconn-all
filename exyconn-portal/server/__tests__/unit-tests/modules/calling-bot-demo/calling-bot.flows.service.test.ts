import { toCallScript, type WaGraph } from '@exyconn/wa-flow';
import {
  ensureCallingBotFlows,
  saveScenarioFlow,
} from '../../../../src/modules/calling-bot-demo/calling-bot.flows.service';
import { SCENARIO_FLOWS } from '../../../../src/modules/calling-bot-demo/calling-bot.flows.seed';
import { CallingBotScenarioModel } from '../../../../src/modules/calling-bot-demo/calling-bot.models';
import { MigrationModel } from '../../../../src/lib/migrations';
import { scenarioInput, UNKNOWN_ID } from './callingBot.fixtures';

const CLINIC = 'clinic-appointment';
const clinicFlow = (): WaGraph => structuredClone(SCENARIO_FLOWS[CLINIC]);

const newScenario = async (fields: Record<string, unknown> = {}) =>
  String((await CallingBotScenarioModel.create({ ...scenarioInput(), ...fields }))._id);

describe('saveScenarioFlow', () => {
  it('stores a voice flow with the script compiled from it', async () => {
    const id = await newScenario();
    const saved = await saveScenarioFlow(id, clinicFlow());
    expect(saved.flow).toEqual(clinicFlow());
    expect(saved.callScript).toBe(toCallScript(clinicFlow()));
    expect(saved.callScript).not.toBe('');
  });

  it.each([null, undefined])('removes the flow and the script when sent %p', async (flow) => {
    const id = await newScenario();
    await saveScenarioFlow(id, clinicFlow());
    const cleared = await saveScenarioFlow(id, flow);
    expect(cleared.flow).toBeNull();
    expect(cleared.callScript).toBe('');
  });

  it('refuses something that is not a flow', async () => {
    const id = await newScenario();
    await expect(saveScenarioFlow(id, { start: 'a', nodes: [] })).rejects.toThrow(
      'The call flow is not valid.',
    );
  });

  it('refuses steps a call cannot carry, by id', async () => {
    const id = await newScenario();
    const flow = clinicFlow();
    flow.nodes.push({
      id: 'pause',
      type: 'delay',
      position: { x: 0, y: 0 },
      data: { ms: 1000 },
    });
    await expect(saveScenarioFlow(id, flow)).rejects.toThrow(
      'A call cannot carry these steps: pause. Remove them first.',
    );
  });

  it('refuses a flow with errors, listing them', async () => {
    const id = await newScenario();
    const flow = { ...clinicFlow(), start: 'nowhere' };
    await expect(saveScenarioFlow(id, flow)).rejects.toThrow(
      'Fix the call flow first: The workflow has no start node.',
    );
    expect((await CallingBotScenarioModel.findById(id).lean())?.flow).toBeNull();
  });

  it('refuses a malformed or unknown example id', async () => {
    await expect(saveScenarioFlow('not-an-id', null)).rejects.toThrow(
      'Calling bot example not found',
    );
    await expect(saveScenarioFlow(UNKNOWN_ID, clinicFlow())).rejects.toThrow(
      'Calling bot example not found',
    );
  });
});

describe('ensureCallingBotFlows', () => {
  it('gives a seeded example without a flow its starter flow, once', async () => {
    const id = await newScenario({ key: CLINIC });
    await ensureCallingBotFlows();
    const seeded = await CallingBotScenarioModel.findById(id).lean();
    expect(seeded?.flow).toEqual(clinicFlow());
    expect(seeded?.callScript).toBe(toCallScript(clinicFlow()));
    expect(await MigrationModel.exists({ name: `calling-bot-flow:${CLINIC}` })).toBeTruthy();

    await saveScenarioFlow(id, null);
    await ensureCallingBotFlows();
    expect((await CallingBotScenarioModel.findById(id).lean())?.flow).toBeNull();
  });

  it('leaves a flow drawn in Tech alone, including on rows stored without the field', async () => {
    const drawn = { ...clinicFlow(), start: clinicFlow().nodes[1].id };
    const id = await newScenario({ key: CLINIC, flow: drawn });
    const { insertedId } = await CallingBotScenarioModel.collection.insertOne({
      ...scenarioInput({ title: 'Old row' }),
      key: 'order-status',
    });
    await ensureCallingBotFlows();
    expect((await CallingBotScenarioModel.findById(id).lean())?.flow).toEqual(drawn);
    expect((await CallingBotScenarioModel.findById(insertedId).lean())?.flow).toEqual(
      SCENARIO_FLOWS['order-status'],
    );
  });
});
