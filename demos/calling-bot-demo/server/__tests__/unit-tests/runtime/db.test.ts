import mongoose from 'mongoose';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CallModel, ConfigModel, connectDatabase, ScenarioModel } from '../../../src/runtime/db';

describe('the voice server database', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('builds each model from the shared field definitions, with timestamps', () => {
    expect(ConfigModel.modelName).toBe('CallingBotConfig');
    expect(CallModel.modelName).toBe('CallingBotCall');
    expect(ScenarioModel.modelName).toBe('CallingBotScenario');
    expect(ConfigModel.schema.path('ticketSecret').isRequired).toBe(true);
    expect(CallModel.schema.path('createdAt')).toBeDefined();
    expect(ScenarioModel.schema.path('callScript')).toBeDefined();
  });

  it("connects to the portal's database", async () => {
    const connect = vi.spyOn(mongoose, 'connect').mockResolvedValue(mongoose);
    await connectDatabase();
    expect(connect).toHaveBeenCalledWith('mongodb://voice.test/calls');
  });
});
