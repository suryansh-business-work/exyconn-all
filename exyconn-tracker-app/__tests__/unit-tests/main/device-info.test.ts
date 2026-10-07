import { beforeEach, describe, expect, it, vi } from 'vitest';
import { arch, hostname, release, type } from 'node:os';

const { machineIdSync, cpus } = vi.hoisted(() => ({
  machineIdSync: vi.fn(() => 'machine-guid'),
  cpus: vi.fn((): Array<{ model?: string }> => [
    { model: '  Ryzen 7 5800X  ' },
    { model: 'Ryzen 7 5800X' },
  ]),
}));

vi.mock('electron', () => ({
  app: { getVersion: () => '1.10.6', getLocale: () => 'en-GB' },
  screen: {
    getAllDisplays: () => [{ id: 1 }, { id: 2 }],
    getPrimaryDisplay: () => ({ size: { width: 2560, height: 1440 } }),
  },
}));
vi.mock('node-machine-id', () => ({ machineIdSync }));
vi.mock('node:os', async (importOriginal) => ({
  ...(await importOriginal<typeof import('node:os')>()),
  cpus,
  totalmem: () => 16 * 1024 * 1024 * 1024,
}));
vi.mock('../../../src/main/store', () => ({ secureStore: () => ({ deviceId: 'install-uuid' }) }));

import { collectDeviceInfo } from '../../../src/main/device-info';

beforeEach(() => {
  machineIdSync.mockReset().mockReturnValue('machine-guid');
});

describe('collectDeviceInfo', () => {
  it('describes this machine the way the portal records it', () => {
    expect(collectDeviceInfo()).toEqual({
      deviceId: 'install-uuid',
      platform: process.platform,
      hostname: hostname(),
      appVersion: '1.10.6',
      machineId: 'machine-guid',
      osName: type(),
      osVersion: release(),
      arch: arch(),
      cpuModel: 'Ryzen 7 5800X',
      cpuCores: 2,
      totalMemoryMb: 16_384,
      locale: 'en-GB',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenCount: 2,
      screenResolution: '2560x1440',
    });
    // The raw OS id, so the same laptop is recognisable across reinstalls.
    expect(machineIdSync).toHaveBeenCalledWith(false);
  });

  it('records no machine id when the OS will not give one', () => {
    machineIdSync.mockImplementation(() => {
      throw new Error('registry locked');
    });

    expect(collectDeviceInfo().machineId).toBe('');
  });

  it('copes with a machine that reports no CPUs', () => {
    cpus.mockReturnValueOnce([]);

    const info = collectDeviceInfo();

    expect(info.cpuModel).toBe('');
    expect(info.cpuCores).toBe(0);
  });

  it('leaves the model blank when the CPU does not name itself', () => {
    cpus.mockReturnValueOnce([{}]);

    expect(collectDeviceInfo()).toMatchObject({ cpuModel: '', cpuCores: 1 });
  });
});
