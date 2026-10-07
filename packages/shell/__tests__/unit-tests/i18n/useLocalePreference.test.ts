import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { deviceTimezone } from '@exyconn/i18n';
import { useAppSettingsQuery, useMeQuery } from '@/graphql/generated';
import { useLocalePreference } from '@/i18n/useLocalePreference';

vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  useAppSettingsQuery: vi.fn(),
  useMeQuery: vi.fn(),
}));

type SettingsResult = ReturnType<typeof useAppSettingsQuery>;
type MeResult = ReturnType<typeof useMeQuery>;
type Settings = {
  defaultLocale?: string;
  timezone?: string;
  dateFormat?: string;
  timeFormat?: string;
  currency?: string;
};
type Me = { locale?: string | null; timezone?: string | null };

const KEY = 'exyconn.locale';
const state: { settings?: Settings; loading: boolean; me?: Me } = { loading: false };

function setup() {
  return renderHook(() => useLocalePreference());
}

beforeEach(() => {
  state.settings = undefined;
  state.me = undefined;
  state.loading = false;
  vi.mocked(useAppSettingsQuery).mockImplementation(
    () =>
      ({
        data: state.settings && { appSettings: state.settings },
        loading: state.loading,
      }) as SettingsResult,
  );
  vi.mocked(useMeQuery).mockImplementation(
    () => ({ data: state.me && { me: state.me } }) as MeResult,
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useLocalePreference before anything has loaded', () => {
  it("reads in the browser's language and the device's zone, with the built-in patterns", () => {
    state.loading = true;
    const { result } = setup();
    expect(result.current.locale).toBe('en-US');
    expect(result.current.timezone).toBe(deviceTimezone());
    expect(result.current.dateFormat).toBe('dd MMM yyyy');
    expect(result.current.timeFormat).toBe('hh:mm a');
    expect(result.current.currency).toBe('');
    expect(result.current.ready).toBe(false);
  });

  it('asks for settings from the cache and ignores a signed-out me', () => {
    setup();
    expect(useAppSettingsQuery).toHaveBeenCalledWith({ fetchPolicy: 'cache-first' });
    expect(useMeQuery).toHaveBeenCalledWith({ fetchPolicy: 'cache-first', errorPolicy: 'ignore' });
  });
});

describe('useLocalePreference resolution', () => {
  it("uses the workspace's defaults once its settings are answered", () => {
    state.settings = {
      defaultLocale: 'de',
      timezone: 'Europe/Berlin',
      dateFormat: 'dd.MM.yyyy',
      timeFormat: 'HH:mm',
      currency: 'EUR',
    };
    const { result } = setup();
    expect(result.current).toMatchObject({
      locale: 'de',
      timezone: 'Europe/Berlin',
      dateFormat: 'dd.MM.yyyy',
      timeFormat: 'HH:mm',
      currency: 'EUR',
      ready: true,
    });
  });

  it("puts the person's own language and zone ahead of the workspace's", () => {
    state.settings = { defaultLocale: 'de', timezone: 'Europe/Berlin' };
    state.me = { locale: 'hi', timezone: 'Asia/Kolkata' };
    const { result } = setup();
    expect(result.current.locale).toBe('hi');
    expect(result.current.timezone).toBe('Asia/Kolkata');
  });

  it('uses a language chosen in this browser before signing in', () => {
    localStorage.setItem(KEY, 'fr_FR');
    const { result } = setup();
    expect(result.current.locale).toBe('fr-FR');
  });

  it('replaces the browser choice with the account language on sign-in', () => {
    localStorage.setItem(KEY, 'fr');
    const { result, rerender } = setup();
    expect(result.current.locale).toBe('fr');
    state.me = { locale: 'es' };
    rerender();
    expect(result.current.locale).toBe('es');
  });

  it('renders when the browser blocks site data', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const { result } = setup();
    expect(result.current.locale).toBe('en-US');
  });
});

describe('useLocalePreference.choose', () => {
  it('switches the language and remembers it for this browser', () => {
    const { result } = setup();
    act(() => result.current.choose('pt_BR'));
    expect(result.current.locale).toBe('pt-BR');
    expect(localStorage.getItem(KEY)).toBe('pt-BR');
  });

  it('wins over the account language until the next sign-in', () => {
    state.me = { locale: 'es' };
    const { result } = setup();
    act(() => result.current.choose('ja'));
    expect(result.current.locale).toBe('ja');
  });

  it('ignores something that is not a language', () => {
    const { result } = setup();
    act(() => result.current.choose('not a locale!'));
    expect(result.current.locale).toBe('en-US');
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('still applies the choice when storage refuses it', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    const { result } = setup();
    act(() => result.current.choose('it'));
    expect(result.current.locale).toBe('it');
  });
});
