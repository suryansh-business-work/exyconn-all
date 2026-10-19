import { afterEach, describe, expect, it, vi } from 'vitest';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { readAgentPhone, saveAgentPhone } from '../../../../src/records/comms/agentPhone';

describe('agentPhone', () => {
  afterEach(() => {
    globalThis.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('reads blank until a phone is saved, then the saved phone', () => {
    expect(readAgentPhone()).toBe('');

    saveAgentPhone('+14155550100');

    expect(readAgentPhone()).toBe('+14155550100');
  });

  it('reads blank and logs when storage is blocked', () => {
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    const blocked = new Error('SecurityError');
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw blocked;
    });

    expect(readAgentPhone()).toBe('');
    expect(warn).toHaveBeenCalledWith('crm: could not read the saved phone', blocked);
  });

  it('logs instead of throwing when the phone cannot be saved', () => {
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    const full = new Error('QuotaExceededError');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw full;
    });

    expect(() => saveAgentPhone('+14155550100')).not.toThrow();
    expect(warn).toHaveBeenCalledWith('crm: could not remember the phone', full);
  });
});
