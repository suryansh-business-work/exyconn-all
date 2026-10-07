// @vitest-environment jsdom
import { act, type ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useI18n, type Messages } from '@exyconn/i18n';
import { deviceLocale } from '@exyconn/tracker-core';
import TrackerI18nProvider from '../../../../src/renderer/i18n/TrackerI18nProvider';
import { deferred, render, stubTracker, unmountAll } from '../../test-utils';

vi.mock('../../../../src/renderer/logger', () => ({ logger: { error: vi.fn() } }));

function Greeting(): ReactElement {
  const { t, settings } = useI18n();
  return (
    <p>
      <span id="hello">{t('Hello')}</span>
      <span id="bye">{t('Goodbye')}</span>
      <span id="zone">{settings.timezone}</span>
    </p>
  );
}

function text(id: string): string | null | undefined {
  return document.getElementById(id)?.textContent;
}

async function advance(ms: number): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

const getTranslations = vi.fn((_locale: string) => Promise.resolve<Messages>({}));
const translateMissing = vi.fn((_locale: string, _sources: string[]) =>
  Promise.resolve<Messages>({}),
);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  getTranslations.mockReset();
  translateMissing.mockReset();
  translateMissing.mockResolvedValue({});
  stubTracker({ getTranslations, translateMissing });
});

afterEach(() => {
  unmountAll();
  vi.useRealTimers();
  document.documentElement.lang = '';
  document.documentElement.dir = '';
});

describe('TrackerI18nProvider', () => {
  it('reads in the employee’s language, right to left where it should, in their zone', async () => {
    // Held open by hand: render's act would otherwise let the catalogue land before the
    // first look, and the English the screen paints while it loads would never be seen.
    const catalogue = deferred<Messages>();
    getTranslations.mockReturnValue(catalogue.promise);
    await render(
      <TrackerI18nProvider locale="ar" timezone="Asia/Dubai">
        <Greeting />
      </TrackerI18nProvider>,
    );
    expect(text('hello')).toBe('Hello');
    await act(async () => catalogue.resolve({ Hello: 'مرحبا' }));
    await advance(0);
    expect(getTranslations).toHaveBeenCalledWith('ar');
    expect(text('hello')).toBe('مرحبا');
    expect(text('zone')).toBe('Asia/Dubai');
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
  });

  it('asks the portal to translate the strings it had no entry for', async () => {
    getTranslations.mockResolvedValue({ Hello: 'Hola' });
    translateMissing.mockResolvedValue({ Goodbye: 'Adiós' });
    await render(
      <TrackerI18nProvider locale="es" timezone="UTC">
        <Greeting />
      </TrackerI18nProvider>,
    );
    await advance(0);
    expect(text('bye')).toBe('Goodbye');
    await advance(400);
    expect(translateMissing).toHaveBeenCalledTimes(1);
    expect(translateMissing).toHaveBeenCalledWith('es', expect.arrayContaining(['Goodbye']));
    expect(text('bye')).toBe('Adiós');
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('reads in this machine’s language before anyone has signed in', async () => {
    getTranslations.mockResolvedValue({});
    await render(
      <TrackerI18nProvider locale={null} timezone="UTC">
        <Greeting />
      </TrackerI18nProvider>,
    );
    await advance(0);
    expect(getTranslations).toHaveBeenCalledWith(deviceLocale());
    expect(document.documentElement.lang).toBe(deviceLocale());
  });
});
