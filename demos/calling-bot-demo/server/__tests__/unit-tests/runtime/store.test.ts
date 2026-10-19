import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { signCallTicket } from '../../../src/index';
import { makeCall, makeConfig } from '../fixtures';

const models = vi.hoisted(() => ({
  ConfigModel: { findOne: vi.fn() },
  CallModel: { findById: vi.fn(), updateOne: vi.fn() },
  ScenarioModel: { findById: vi.fn() },
}));
vi.mock('../../../src/runtime/db', () => models);

const CALL_ID = '64b000000000000000000001';
const SCENARIO_ID = '64b0000000000000000000a1';
const config = makeConfig();

/** A query whose `.lean()` resolves to `value`, as Mongoose's does. */
const leanOf = (value: unknown) => ({ lean: vi.fn().mockResolvedValue(value) });

async function loadStore() {
  vi.resetModules();
  return import('../../../src/runtime/store.js');
}

describe('the call store', () => {
  beforeEach(() => {
    models.ConfigModel.findOne.mockReturnValue(leanOf(config));
    models.CallModel.updateOne.mockResolvedValue({});
  });
  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('the active config', () => {
    it('is read once and reused for fifteen seconds', async () => {
      vi.useFakeTimers();
      const { activeConfig } = await loadStore();
      await expect(activeConfig()).resolves.toBe(config);
      vi.advanceTimersByTime(14_999);
      await activeConfig();
      expect(models.ConfigModel.findOne).toHaveBeenCalledTimes(1);
      expect(models.ConfigModel.findOne).toHaveBeenCalledWith({ isActive: true });
      vi.advanceTimersByTime(1);
      await activeConfig();
      expect(models.ConfigModel.findOne).toHaveBeenCalledTimes(2);
    });

    it('is null while no config is active', async () => {
      models.ConfigModel.findOne.mockReturnValue(leanOf(null));
      const { activeConfig } = await loadStore();
      await expect(activeConfig()).resolves.toBeNull();
    });
  });

  describe('opening a call from its ticket', () => {
    const ticket = signCallTicket(config.ticketSecret, CALL_ID, 60);

    it('opens a live call on the active config', async () => {
      const call = makeCall();
      models.CallModel.findById.mockReturnValue(leanOf(call));
      const { callForTicket } = await loadStore();
      await expect(callForTicket(ticket)).resolves.toEqual({ call, config });
      expect(models.CallModel.findById).toHaveBeenCalledWith(CALL_ID);
      expect(models.ScenarioModel.findById).not.toHaveBeenCalled();
    });

    it('plays the example the call was started with', async () => {
      models.CallModel.findById.mockReturnValue(leanOf(makeCall({ scenarioId: SCENARIO_ID })));
      models.ScenarioModel.findById.mockReturnValue(
        leanOf({ systemPrompt: 'Loan desk', greeting: 'EMI due', languageCode: 'hi-IN' }),
      );
      const { callForTicket } = await loadStore();
      const opened = await callForTicket(ticket);
      expect(models.ScenarioModel.findById).toHaveBeenCalledWith(SCENARIO_ID);
      expect(opened?.config).toMatchObject({
        systemPrompt: 'Loan desk',
        greeting: 'EMI due',
        languageCode: 'hi-IN',
      });
    });

    it('keeps the config when the example was deleted or never a real id', async () => {
      models.CallModel.findById.mockReturnValue(leanOf(makeCall({ scenarioId: SCENARIO_ID })));
      models.ScenarioModel.findById.mockReturnValue(leanOf(null));
      const { callForTicket } = await loadStore();
      expect((await callForTicket(ticket))?.config).toBe(config);

      models.CallModel.findById.mockReturnValue(leanOf(makeCall({ scenarioId: 'not-an-id' })));
      expect((await callForTicket(ticket))?.config).toBe(config);
      expect(models.ScenarioModel.findById).toHaveBeenCalledTimes(1);
    });

    it('opens nothing while no config is active', async () => {
      models.ConfigModel.findOne.mockReturnValue(leanOf(null));
      const { callForTicket } = await loadStore();
      await expect(callForTicket(ticket)).resolves.toBeNull();
    });

    it('opens nothing for a forged ticket or one naming no real call id', async () => {
      const { callForTicket } = await loadStore();
      await expect(callForTicket('forged.ticket')).resolves.toBeNull();
      await expect(
        callForTicket(signCallTicket(config.ticketSecret, 'not-an-id', 60)),
      ).resolves.toBeNull();
      expect(models.CallModel.findById).not.toHaveBeenCalled();
    });

    it('opens nothing for a call that is gone or already over', async () => {
      const { callForTicket } = await loadStore();
      models.CallModel.findById.mockReturnValue(leanOf(null));
      await expect(callForTicket(ticket)).resolves.toBeNull();
      models.CallModel.findById.mockReturnValue(leanOf(makeCall({ status: 'ENDED' })));
      await expect(callForTicket(ticket)).resolves.toBeNull();
    });
  });

  describe('writing to a call', () => {
    const call = makeCall();
    const unfinished = { _id: CALL_ID, status: { $nin: ['ENDED', 'FAILED'] } };

    it('moves an unfinished call on, with its extra fields', async () => {
      const { setStatus } = await loadStore();
      await setStatus(call, 'LIVE', { providerCallId: 'CA1' });
      await setStatus(call, 'RINGING');
      expect(models.CallModel.updateOne.mock.calls).toEqual([
        [unfinished, { status: 'LIVE', providerCallId: 'CA1' }],
        [unfinished, { status: 'RINGING' }],
      ]);
    });

    it('adds a turn to the transcript', async () => {
      const { addTurn } = await loadStore();
      await addTurn(call, 'CALLER', 'Hello');
      expect(models.CallModel.updateOne).toHaveBeenCalledWith(
        { _id: CALL_ID },
        { $push: { transcript: { role: 'CALLER', text: 'Hello', at: expect.any(Date) } } },
      );
    });

    it('ends an unfinished call with its reason and time', async () => {
      const { endCall } = await loadStore();
      await endCall(call, 'FAILED', 'Sarvam refused');
      expect(models.CallModel.updateOne).toHaveBeenCalledWith(unfinished, {
        status: 'FAILED',
        endReason: 'Sarvam refused',
        endedAt: expect.any(Date),
      });
    });
  });
});
