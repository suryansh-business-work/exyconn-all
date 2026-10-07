import { render, screen, waitFor } from '@testing-library/react';
import { useI18n } from '@exyconn/i18n';
import { deviceLocale } from '@exyconn/tracker-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TrackerI18nProvider } from '../../../src/i18n/I18n';
import { portal } from '../../../src/tracker/platform';

vi.mock('../../../src/tracker/platform', () => ({
  portal: { fetchTranslations: vi.fn(), translateMissing: vi.fn() },
}));
vi.mock('../../../src/tracker/logger', () => ({ logger: { error: vi.fn() } }));

/** Shows what the provider put in front of the tree. */
function Probe() {
  const { locale, settings, t } = useI18n();
  return (
    <p>
      <span data-testid="locale">{locale}</span>
      <span data-testid="zone">{settings.timezone}</span>
      <span data-testid="text">{t('Sign in')}</span>
    </p>
  );
}

describe('TrackerI18nProvider', () => {
  beforeEach(() => {
    vi.mocked(portal.fetchTranslations).mockResolvedValue({});
    vi.mocked(portal.translateMissing).mockResolvedValue({});
  });

  it("speaks the employee's language and zone once the portal has resolved them", async () => {
    vi.mocked(portal.fetchTranslations).mockResolvedValue({ 'Sign in': 'Iniciar sesión' });
    render(
      <TrackerI18nProvider locale="es" timezone="Asia/Kolkata">
        <Probe />
      </TrackerI18nProvider>,
    );
    expect(screen.getByTestId('locale')).toHaveTextContent('es');
    expect(screen.getByTestId('zone')).toHaveTextContent('Asia/Kolkata');
    expect(screen.getByTestId('text')).toHaveTextContent('Sign in');
    await waitFor(() => expect(screen.getByTestId('text')).toHaveTextContent('Iniciar sesión'));
    expect(portal.fetchTranslations).toHaveBeenCalledWith('es');
  });

  it("reads in the phone's own language before anybody has signed in", () => {
    render(
      <TrackerI18nProvider locale={null} timezone="UTC">
        <Probe />
      </TrackerI18nProvider>,
    );
    expect(screen.getByTestId('locale')).toHaveTextContent(deviceLocale());
    expect(portal.fetchTranslations).toHaveBeenCalledWith(deviceLocale());
  });

  it('reports the strings it could not translate so the next launch has them', async () => {
    render(
      <TrackerI18nProvider locale="de" timezone="UTC">
        <Probe />
      </TrackerI18nProvider>,
    );
    await waitFor(() => expect(portal.translateMissing).toHaveBeenCalledWith('de', ['Sign in']));
  });
});
