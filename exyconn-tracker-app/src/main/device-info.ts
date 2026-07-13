import { app, screen } from 'electron';
import { machineIdSync } from 'node-machine-id';
import { hostname, release, arch, cpus, totalmem, type } from 'node:os';
import { secureStore } from './store';

export interface DeviceInfo {
  deviceId: string;
  platform: string;
  hostname: string;
  appVersion: string;
  machineId: string;
  osName: string;
  osVersion: string;
  arch: string;
  cpuModel: string;
  cpuCores: number;
  totalMemoryMb: number;
  locale: string;
  timezone: string;
  screenCount: number;
  screenResolution: string;
}

/**
 * A stable hardware identifier from the OS (registry MachineGuid on Windows,
 * IOPlatformUUID on macOS). Distinct from `deviceId`, which is a per-install UUID and
 * would change on a reinstall — the machine id survives, so the same physical laptop stays
 * recognisable and an employee can't quietly accumulate device rows.
 */
function readMachineId(): string {
  try {
    // `false` = the raw OS id, not a hashed one, so it is comparable across installs.
    return machineIdSync(false);
  } catch {
    return '';
  }
}

/** Everything the portal records about the machine this app is running on. */
export function collectDeviceInfo(): DeviceInfo {
  const displays = screen.getAllDisplays();
  const primary = screen.getPrimaryDisplay();
  const cores = cpus();

  return {
    deviceId: secureStore().deviceId,
    platform: process.platform,
    hostname: hostname(),
    appVersion: app.getVersion(),
    machineId: readMachineId(),
    osName: type(),
    osVersion: release(),
    arch: arch(),
    cpuModel: cores[0]?.model?.trim() ?? '',
    cpuCores: cores.length,
    totalMemoryMb: Math.round(totalmem() / (1024 * 1024)),
    locale: app.getLocale(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screenCount: displays.length,
    screenResolution: `${primary.size.width}x${primary.size.height}`,
  };
}
