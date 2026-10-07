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
