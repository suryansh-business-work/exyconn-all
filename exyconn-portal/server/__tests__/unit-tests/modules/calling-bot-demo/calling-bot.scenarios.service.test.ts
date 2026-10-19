import {
  callingBotScenarios,
  ensureCallingBotScenarios,
} from '../../../../src/modules/calling-bot-demo/calling-bot.scenarios.service';
import { SCENARIO_SEEDS } from '../../../../src/modules/calling-bot-demo/calling-bot.scenarios.seed';
import { SCENARIO_FLOWS } from '../../../../src/modules/calling-bot-demo/calling-bot.flows.seed';
import { CallingBotScenarioModel } from '../../../../src/modules/calling-bot-demo/calling-bot.models';
import { scenarioInput, UNKNOWN_ID } from './callingBot.fixtures';

afterEach(() => jest.restoreAllMocks());

describe('ensureCallingBotScenarios', () => {
  it('seeds every example once, in order, enabled, with the starter flows', async () => {
    await ensureCallingBotScenarios();
    const rows = await callingBotScenarios.list();
    expect(rows.map((row) => row.key)).toEqual(SCENARIO_SEEDS.map((seed) => seed.key));
    expect(rows[0]).toMatchObject({ order: 10, enabled: true, languageCode: '' });
    expect(rows[1].order).toBe(20);
    const clinic = rows.find((row) => row.key === 'clinic-appointment');
    expect(clinic?.flow).toEqual(SCENARIO_FLOWS['clinic-appointment']);
  });

  it('leaves an example Tech deleted deleted on the next boot', async () => {
    await ensureCallingBotScenarios();
    await CallingBotScenarioModel.deleteOne({ key: 'hotel-booking' });
    await ensureCallingBotScenarios();
    expect(await CallingBotScenarioModel.countDocuments()).toBe(SCENARIO_SEEDS.length - 1);
  });

  it('lets the row another server just inserted stand', async () => {
    await CallingBotScenarioModel.init();
    await CallingBotScenarioModel.create({ ...scenarioInput(), key: SCENARIO_SEEDS[0].key });
    await ensureCallingBotScenarios();
    expect(await CallingBotScenarioModel.countDocuments({ key: SCENARIO_SEEDS[0].key })).toBe(1);
    expect(await CallingBotScenarioModel.countDocuments()).toBe(SCENARIO_SEEDS.length);
  });

  it('passes any other failure on', async () => {
    jest.spyOn(CallingBotScenarioModel, 'create').mockRejectedValueOnce(new Error('disk full'));
    await expect(ensureCallingBotScenarios()).rejects.toThrow('disk full');
  });
});

describe('callingBotScenarios', () => {
  it('lists every example for Tech, and only enabled ones, trimmed, for the demo', async () => {
    await callingBotScenarios.create(scenarioInput({ title: 'Zeta', order: 1 }));
    await callingBotScenarios.create(scenarioInput({ title: 'Alpha', order: 1 }));
    await callingBotScenarios.create(scenarioInput({ title: 'Hidden', order: 0, enabled: false }));
    expect((await callingBotScenarios.list()).map((row) => row.title)).toEqual([
      'Hidden',
      'Alpha',
      'Zeta',
    ]);
    const options = await callingBotScenarios.listEnabled();
    expect(options.map((row) => row.title)).toEqual(['Alpha', 'Zeta']);
    expect(options[0]).not.toHaveProperty('systemPrompt');
  });

  it('finds an enabled example for a call, and refuses a disabled, unknown or malformed one', async () => {
    const on = await callingBotScenarios.create(scenarioInput());
    const off = await callingBotScenarios.create(scenarioInput({ enabled: false }));
    expect((await callingBotScenarios.forCall(String(on._id))).title).toBe('Clinic booking');
    for (const id of [String(off._id), UNKNOWN_ID, 'nope']) {
      await expect(callingBotScenarios.forCall(id)).rejects.toThrow(
        'That example is no longer offered. Pick another one.',
      );
    }
  });

  it('updates and deletes an example, refusing unknown ones', async () => {
    const created = await callingBotScenarios.create(scenarioInput());
    const id = String(created._id);
    const updated = await callingBotScenarios.update(id, scenarioInput({ title: 'Dentist' }));
    expect(updated.title).toBe('Dentist');
    await expect(callingBotScenarios.update(id, scenarioInput({ title: ' ' }))).rejects.toThrow();
    expect((await callingBotScenarios.remove(id)).title).toBe('Dentist');
    await expect(callingBotScenarios.update(id, scenarioInput())).rejects.toThrow(
      'Calling bot example not found',
    );
    await expect(callingBotScenarios.remove(id)).rejects.toThrow('Calling bot example not found');
  });
});
