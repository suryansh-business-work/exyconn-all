import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Branding, TrackerSettings } from '../../src/types';
import { deviceTimezone } from '../../src/timezone';
import { DEVICE, loginResponse, me } from './controller-data';
import { rig, signedIn } from './controller-fixture';

const secret = process.env.TRACKER_TEST_SECRET ?? randomUUID();

describe('TrackerController restore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-03T10:00:00.000Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('shows the login screen, with the brand, when nothing is remembered', async () => {
    const setup = rig();
    const branding: Branding = {
      businessName: 'Exyconn',
      legalName: 'Exyconn Ltd',
      slogan: '',
      logoUrl: '',
      logoDarkUrl: '',
      appIconUrl: '',
      faviconUrl: '',
      primaryColor: '',
      secondaryColor: '',
      accentColor: '',
      backgroundColor: '',
      textColor: '',
      supportEmail: '',
      websiteUrl: '',
      copyrightText: '',
    };
    vi.mocked(setup.portal.fetchBranding).mockResolvedValue(branding);

    await setup.controller.restore();

    expect(setup.portal.trackerMe).not.toHaveBeenCalled();
    expect(setup.latest()).toMatchObject({ status: 'signed-out', branding, user: null });
    expect(setup.latest().stats.dayActiveMs).toBe(0);
  });

  it('falls back to default branding when the portal cannot serve it', async () => {
    const setup = rig();

    await setup.controller.restore();

    expect(setup.latest().branding).toBeNull();
  });

  it('rebuilds the remembered session from the portal', async () => {
    const setup = await signedIn({ timezone: 'Asia/Kolkata', locale: 'hi' });

    const state = setup.controller.getState();
    expect(state).toMatchObject({
      status: 'idle',
      user: { id: 'u1' },
      timezone: 'Asia/Kolkata',
      locale: 'hi',
      selectedProjectId: 'global',
      rememberMe: true,
      permissions: { camera: false },
    });
    expect(setup.deps.createEngine).toHaveBeenCalledTimes(1);
    // The new engine starts from the portal's number for the day.
    expect(state.stats.dayActiveMs).toBe(600_000);
    expect(setup.portal.fetchTasks).toHaveBeenCalledWith('global');
  });

  it('drops a token the portal no longer honours', async () => {
    const setup = rig(`device-${Date.now()}`);
    vi.mocked(setup.portal.trackerMe).mockRejectedValue(new Error('revoked'));

    await setup.controller.restore();

    expect(setup.store.clearToken).toHaveBeenCalledTimes(1);
    expect(setup.latest().status).toBe('signed-out');
    expect(setup.deps.createEngine).not.toHaveBeenCalled();
  });

  it('logs a ticket list that fails to load without failing the restore', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const setup = rig(`device-${Date.now()}`);
    const cause = new Error('tickets down');
    vi.mocked(setup.portal.fetchTasks).mockRejectedValue(cause);

    await setup.controller.restore();
    await vi.advanceTimersByTimeAsync(0);

    expect(error).toHaveBeenCalledWith('Loading tickets failed', cause);
    expect(setup.latest()).toMatchObject({ status: 'idle', tasks: [], tasksLoading: false });
  });
});

describe('TrackerController login', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('signs in, remembers the token as asked, then reads the full state', async () => {
    const setup = rig();
    const answer = loginResponse();
    vi.mocked(setup.portal.login).mockResolvedValue(answer);
    vi.mocked(setup.portal.trackerMe).mockResolvedValue(me({ timezone: 'Europe/Paris' }));

    const result = await setup.controller.login('asha@example.com', secret, true);

    expect(result).toEqual({ ok: true, consentRequired: false, user: answer.user });
    expect(setup.portal.login).toHaveBeenCalledWith('asha@example.com', secret, DEVICE);
    expect(setup.store.setToken).toHaveBeenCalledWith(answer.token, true);
    expect(setup.latest()).toMatchObject({ status: 'idle', timezone: 'Europe/Paris' });
  });

  it('lands on the consent screen when the portal requires it', async () => {
    const setup = rig();
    vi.mocked(setup.portal.login).mockResolvedValue(loginResponse({ consentRequired: true }));
    vi.mocked(setup.portal.trackerMe).mockRejectedValue(new Error('later'));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const result = await setup.controller.login('asha@example.com', secret, false);

    expect(result.consentRequired).toBe(true);
    expect(setup.latest().status).toBe('consent-required');
    expect(setup.latest().timezone).toBe(deviceTimezone());
  });

  it('stays signed in when the follow-up read fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const setup = rig();
    const cause = new Error('portal hiccup');
    vi.mocked(setup.portal.trackerMe).mockRejectedValue(cause);

    const result = await setup.controller.login('asha@example.com', secret, false);

    expect(result.ok).toBe(true);
    expect(setup.latest().status).toBe('idle');
    expect(error).toHaveBeenCalledWith(
      'Could not read the portal after sign-in; using this device’s zone',
      cause,
    );
  });

  it('gives the login screen a sentence and keeps the raw failure for the log', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const setup = rig();
    const cause = new TypeError('fetch failed');
    vi.mocked(setup.portal.login).mockRejectedValue(cause);

    const result = await setup.controller.login('asha@example.com', secret, true);

    expect(result).toEqual({
      ok: false,
      error: 'Cannot reach the portal. Check your internet connection, then try signing in again.',
    });
    expect(error).toHaveBeenCalledWith('Tracker sign-in failed', cause);
    expect(setup.store.setToken).not.toHaveBeenCalled();
  });

  it('builds no engine when the sign-in answer carries no settings', async () => {
    const setup = rig();
    vi.mocked(setup.portal.login).mockResolvedValue(
      loginResponse({ settings: null as unknown as TrackerSettings }),
    );
    vi.mocked(setup.portal.trackerMe).mockRejectedValue(new Error('later'));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await setup.controller.login('asha@example.com', secret, false);
    await setup.controller.start();

    expect(setup.deps.createEngine).not.toHaveBeenCalled();
    expect(setup.latest().status).toBe('idle');
    expect(setup.latest().permissions).toEqual({ camera: false });
  });
});
