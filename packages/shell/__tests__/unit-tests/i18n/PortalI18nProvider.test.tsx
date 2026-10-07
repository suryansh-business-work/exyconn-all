import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFormatters, useI18n, useT } from '@exyconn/i18n';
import { useLocaleBundleQuery, useTranslateMissingMutation } from '@/graphql/generated';
import { useLocalePreference, type LocalePreference } from '@/i18n/useLocalePreference';
import { PortalI18nProvider } from '@/i18n/PortalI18nProvider';

vi.mock('@/i18n/useLocalePreference', () => ({ useLocalePreference: vi.fn() }));
vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  useLocaleBundleQuery: vi.fn(),
  useTranslateMissingMutation: vi.fn(),
}));

type BundleResult = ReturnType<typeof useLocaleBundleQuery>;

const refetch = vi.fn();
const translate = vi.fn();

function prefer(patch: Partial<LocalePreference> = {}) {
  vi.mocked(useLocalePreference).mockReturnValue({
    locale: 'es',
    timezone: 'Europe/Madrid',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: 'HH:mm',
    currency: 'EUR',
    choose: vi.fn(),
    ready: true,
    ...patch,
  });
}

function bundle(translations: { source: string; text: string }[] | undefined) {
  const data = translations && { localeBundle: { translations } };
  vi.mocked(useLocaleBundleQuery).mockReturnValue({ data, refetch } as unknown as BundleResult);
}

async function advanceBatch() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(400);
  });
}

/** The screen paints before the bundle, then re-renders when the bundle lands. */
async function paintThenLand(translations: { source: string; text: string }[]) {
  bundle(undefined);
  const { rerender } = render(
    <PortalI18nProvider>
      <Probe />
    </PortalI18nProvider>,
  );
  bundle(translations);
  rerender(
    <PortalI18nProvider>
      <Probe />
    </PortalI18nProvider>,
  );
  await advanceBatch();
}

function Probe() {
  const t = useT();
  const { locale, settings } = useI18n();
  const { formatCurrency } = useFormatters();
  return (
    <p>
      {t('Save')} | {t('Cancel')} | {locale} | {settings.timezone} | {formatCurrency(5)}
    </p>
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  refetch.mockReset().mockResolvedValue({});
  translate.mockReset().mockResolvedValue({ data: { translateMissing: [] } });
  vi.mocked(useTranslateMissingMutation).mockReturnValue([translate] as unknown as ReturnType<
    typeof useTranslateMissingMutation
  >);
  prefer();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('PortalI18nProvider', () => {
  it('paints in English straight away, before any translation arrives', () => {
    bundle(undefined);
    render(
      <PortalI18nProvider>
        <Probe />
      </PortalI18nProvider>,
    );
    expect(screen.getByText(/Save \| Cancel \| es \| Europe\/Madrid/)).toBeInTheDocument();
    expect(useLocaleBundleQuery).toHaveBeenCalledWith({
      variables: { locale: 'es' },
      fetchPolicy: 'cache-and-network',
    });
  });

  it("applies the language bundle and the company's formats", () => {
    bundle([{ source: 'Save', text: 'Guardar' }]);
    render(
      <PortalI18nProvider>
        <Probe />
      </PortalI18nProvider>,
    );
    expect(screen.getByText(/Guardar \| Cancel \| es/)).toBeInTheDocument();
    expect(screen.getByText(/€/)).toBeInTheDocument();
  });

  it('asks the server to translate what the bundle lacked, then reloads the bundle', async () => {
    translate.mockResolvedValue({
      data: { translateMissing: [{ key: 'k', source: 'Cancel', text: 'Cancelar' }] },
    });
    await paintThenLand([{ source: 'Save', text: 'Guardar' }]);
    expect(translate).toHaveBeenCalledTimes(1);
    expect(translate).toHaveBeenCalledWith({ variables: { locale: 'es', sources: ['Cancel'] } });
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('does not reload when the server translated nothing', async () => {
    await paintThenLand([]);
    expect(translate).toHaveBeenCalledWith({
      variables: { locale: 'es', sources: ['Save', 'Cancel'] },
    });
    expect(refetch).not.toHaveBeenCalled();
  });

  it('logs a reload that fails and keeps the screen', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const failure = new Error('offline');
    refetch.mockRejectedValue(failure);
    translate.mockResolvedValue({
      data: { translateMissing: [{ key: 'k', source: 'Save', text: 'Guardar' }] },
    });
    await paintThenLand([]);
    expect(error).toHaveBeenCalledWith('Could not reload translations', failure);
    expect(screen.getByText(/Save \| Cancel/)).toBeInTheDocument();
  });

  // Current behaviour (reported as a suspected bug): the locale-change effect also runs on
  // mount, after the first paint has already reported its misses, and clears them.
  it('drops the misses of a first paint that is never re-rendered', async () => {
    bundle([]);
    render(
      <PortalI18nProvider>
        <Probe />
      </PortalI18nProvider>,
    );
    await advanceBatch();
    expect(translate).not.toHaveBeenCalled();
  });

  it('reports nothing until the workspace settings have been answered', async () => {
    prefer({ ready: false });
    await paintThenLand([]);
    expect(translate).not.toHaveBeenCalled();
  });
});
