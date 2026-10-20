import { describe, expect, it } from 'vitest';
import { MODULES, appForPath, moduleUrl } from '@/config/modules';

const moduleFor = (key: string) => {
  const found = MODULES.find((m) => m.key === key);
  if (!found) throw new Error(`No module ${key}`);
  return found;
};

describe('appForPath', () => {
  it('finds the app by its own top-level path', () => {
    expect(appForPath('/hr')).toBe('hr');
    expect(appForPath('/finance/invoices/123')).toBe('finance');
  });

  it('finds the app that owns a page living outside its own prefix', () => {
    expect(appForPath('/profile')).toBe('employee');
    expect(appForPath('/me/leave')).toBe('employee');
  });

  it('is undefined for a path no module claims', () => {
    expect(appForPath('/nowhere/at/all')).toBeUndefined();
    expect(appForPath('/')).toBeUndefined();
  });
});

describe('moduleUrl', () => {
  // The test bundle is the hub (VITE_PORTAL_APP unset) on localhost ports.
  it('links to the module page itself by default', () => {
    expect(moduleUrl(moduleFor('hr'))).toBe('http://localhost:4027/hr');
  });

  it('links to a given page inside the module', () => {
    expect(moduleUrl(moduleFor('hr'), '/hr/leave')).toBe('http://localhost:4027/hr/leave');
  });

  it('keeps a link into this very app relative', () => {
    const hub = { ...moduleFor('hr'), key: 'hub' as const };
    expect(moduleUrl(hub, '/apps')).toBe('/apps');
  });
});

describe('Meeting Assistant navigation', () => {
  it('files every AI meeting page under one section and keeps Releases to administrators', () => {
    const pages = (moduleFor('ai').children ?? []).filter((child) =>
      child.path.startsWith('/ai/meeting-assistant'),
    );
    expect(pages.map((page) => page.path)).toEqual([
      '/ai/meeting-assistant',
      '/ai/meeting-assistant/meetings',
      '/ai/meeting-assistant/transcripts',
      '/ai/meeting-assistant/notes',
      '/ai/meeting-assistant/actions',
      '/ai/meeting-assistant/participants',
      '/ai/meeting-assistant/extension',
      '/ai/meeting-assistant/settings',
      '/ai/meeting-assistant/logs',
      '/ai/meeting-assistant/releases',
    ]);
    expect(new Set(pages.map((page) => page.group))).toEqual(new Set(['Meeting Assistant']));
    expect(pages.filter((page) => page.role).map((page) => [page.key, page.role])).toEqual([
      ['ma-releases', 'ADMIN'],
    ]);
  });

  it("gives My Workspace the viewer's own meetings, actions and the extension", () => {
    const pages = (moduleFor('employee').children ?? []).filter(
      (child) => child.group === 'My meetings',
    );
    expect(pages.map((page) => page.path)).toEqual([
      '/me/meetings',
      '/me/meetings/actions',
      '/me/meetings/extension',
    ]);
  });
});
