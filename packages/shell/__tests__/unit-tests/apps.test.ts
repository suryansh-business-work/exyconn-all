import { describe, expect, it } from 'vitest';
import { PORTAL_APPS } from '../../src/config/apps';
import { MODULES } from '../../src/config/modules';

const entries = Object.entries(PORTAL_APPS);

describe('portal app registry', () => {
  it('gives every app its own dev port', () => {
    const ports = entries.map(([, app]) => app.port);
    expect(new Set(ports).size).toBe(ports.length);
  });

  it('gives every app its own address: a subdomain, or a path on one the demos share', () => {
    const addresses = entries.map(([, app]) => {
      const basePath = 'basePath' in app ? app.basePath : '';
      return `${app.subdomain}${basePath}`;
    });
    expect(new Set(addresses).size).toBe(addresses.length);
  });

  it('titles and describes every app for its page head', () => {
    for (const [key, app] of entries) {
      expect(app.title, key).not.toBe('');
      expect(app.description, key).not.toBe('');
    }
  });

  it('serves every navigable module from a registered app', () => {
    for (const module of MODULES) {
      expect(PORTAL_APPS, module.key).toHaveProperty(module.key);
    }
  });
});
