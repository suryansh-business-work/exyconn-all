import { Outbox, type PortalClientConfig } from '@exyconn/tracker-core';
import { describe, expect, it, vi } from 'vitest';
import { baseDeps, noInputCounter, portal } from '../../../../src/tracker/platform/shared';

const created = vi.hoisted(() => ({ config: null as PortalClientConfig | null }));

vi.mock('@exyconn/tracker-core', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  createPortalClient: (config: PortalClientConfig) => {
    created.config = config;
    return { name: 'portal-client' };
  },
}));
vi.mock('../../../../src/tracker/store', () => ({
  mobileStore: () => ({ getToken: () => 'phone-device-token' }),
}));

describe('the phone’s portal client', () => {
  it('talks to the build’s GraphQL address with this phone’s device token', () => {
    expect(portal).toEqual({ name: 'portal-client' });
    expect(created.config?.url).toBe('https://portal.example.test/graphql');
    expect(created.config?.getToken()).toBe('phone-device-token');
  });
});

describe('noInputCounter', () => {
  it('counts no keys or taps, because a phone cannot see them', () => {
    expect(noInputCounter.start()).toBeUndefined();
    expect(noInputCounter.stop()).toBeUndefined();
    expect(noInputCounter.peek()).toEqual({ keys: 0, clicks: 0 });
    expect(noInputCounter.drain()).toEqual({ keys: 0, clicks: 0 });
  });
});

describe('baseDeps', () => {
  it('shares the portal, a durable outbox on disk and the empty input counter', () => {
    const deps = baseDeps();
    expect(deps.portal).toBe(portal);
    expect(deps.outbox).toBeInstanceOf(Outbox);
    expect(deps.input).toBe(noInputCounter);
  });
});
