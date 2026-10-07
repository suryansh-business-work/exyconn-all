import { describe, expect, it, vi } from 'vitest';
import { deviceInfo, loadDeviceInfo } from '../../../src/tracker/device-info';

vi.mock('../../../src/tracker/store', () => ({
  mobileStore: () => ({ deviceId: 'install-2' }),
}));
vi.mock('expo-device', () => ({
  deviceName: null,
  osName: null,
  osVersion: null,
  modelName: null,
  supportedCpuArchitectures: null,
  totalMemory: null,
}));
vi.mock('expo-application', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  nativeApplicationVersion: null,
}));

describe('device info on a phone that reports little', () => {
  it('sends blanks and zeros rather than inventing values', async () => {
    await loadDeviceInfo();
    expect(deviceInfo()).toMatchObject({
      deviceId: 'install-2',
      hostname: '',
      appVersion: '',
      osName: 'ios',
      osVersion: '',
      arch: '',
      cpuModel: '',
      totalMemoryMb: 0,
    });
  });
});
