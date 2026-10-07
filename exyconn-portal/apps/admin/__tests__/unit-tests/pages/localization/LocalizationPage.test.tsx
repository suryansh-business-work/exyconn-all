import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test-utils';
import { LocalizationPage } from '../../../../src/pages/localization';

const hooks = vi.hoisted(() => ({
  locales: undefined as unknown,
  settings: undefined as unknown,
  translations: { data: undefined as unknown, loading: false },
  translationsQuery: vi.fn(),
  refetch: vi.fn(),
  setTranslation: vi.fn(),
  translate: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useLocaleOptionsQuery: () => ({ data: hooks.locales }),
  useAppSettingsQuery: () => ({ data: hooks.settings }),
  useTranslationsQuery: (options: unknown) => {
    hooks.translationsQuery(options);
    return { ...hooks.translations, refetch: hooks.refetch };
  },
  useSetTranslationMutation: () => [hooks.setTranslation],
  useTranslateEverythingMutation: () => [hooks.translate, { loading: false }],
}));

const option = (tag: string, label: string) => ({ tag, label, direction: 'ltr' });
const LANGUAGES = [option('en', 'English'), option('fr', 'Français'), option('de', 'Deutsch')];

const row = (id: string, source: string, text: string, kind: string, model = '') => ({
  id,
  locale: 'fr',
  key: `key-${id}`,
  source,
  text,
  kind,
  model,
  updatedAt: '2026-09-19T10:30:00.000Z',
});

const ROWS = [
  row('1', 'Sign in', 'Se connecter', 'HUMAN'),
  row('2', 'Sign out', 'Se déconnecter', 'MACHINE', 'gpt-4o-mini'),
  row('3', 'Settings', 'Paramètres', 'MACHINE'),
];

const EMPTY =
  'Nothing translated into this language yet. It fills in as people browse the portal, or use Translate everything with AI.';

beforeEach(() => {
  hooks.locales = { localeOptions: LANGUAGES };
  hooks.settings = { appSettings: { defaultLocale: 'en' } };
  hooks.translations = { data: { translations: { total: 3, rows: ROWS } }, loading: false };
  hooks.refetch.mockResolvedValue({});
});
afterEach(() => vi.resetAllMocks());

const lastQuery = () => hooks.translationsQuery.mock.calls.at(-1)?.[0];
const rowOf = (source: string) =>
  screen.getByRole('textbox', { name: `Translation of "${source}"` }).closest('tr') as HTMLElement;

function mount() {
  const user = userEvent.setup();
  renderWithProviders(<LocalizationPage />);
  return user;
}

describe('LocalizationPage', () => {
  it('opens on the first language that is not the default, with who wrote each row', () => {
    mount();
    expect(screen.getByRole('heading', { name: 'Localization' })).toBeInTheDocument();
    expect(lastQuery()).toEqual({
      variables: { locale: 'fr', search: '', limit: 50 },
      skip: false,
      fetchPolicy: 'cache-and-network',
    });
    expect(screen.getByRole('combobox', { name: 'Language' })).toHaveTextContent('Français');
    expect(screen.getByText('3 translated')).toBeInTheDocument();
    expect(within(rowOf('Sign in')).getByText('Person')).toBeInTheDocument();
    expect(within(rowOf('Sign out')).getByText('gpt-4o-mini')).toBeInTheDocument();
    expect(within(rowOf('Settings')).getByText('Machine')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Translation of "Sign in"' })).toHaveValue(
      'Se connecter',
    );
  });

  it("opens on English when the workspace's own default is another language", () => {
    hooks.settings = { appSettings: { defaultLocale: 'fr' } };
    mount();
    expect(lastQuery()).toMatchObject({ variables: { locale: 'en' }, skip: false });
    expect(screen.getByRole('combobox', { name: 'Language' })).toHaveTextContent('English');
  });

  it('asks again for the language picked and the text searched for', async () => {
    const user = mount();
    await user.click(screen.getByRole('combobox', { name: 'Language' }));
    await user.click(await screen.findByRole('option', { name: 'Deutsch' }));
    expect(lastQuery()).toMatchObject({ variables: { locale: 'de', search: '' } });

    await user.type(screen.getByRole('textbox', { name: 'Search' }), 'sign');
    expect(lastQuery()).toMatchObject({ variables: { locale: 'de', search: 'sign' } });
  });

  it('asks for nothing while only the default language is enabled', () => {
    hooks.settings = undefined;
    hooks.locales = { localeOptions: [option('en', 'English')] };
    hooks.translations = { data: undefined, loading: false };
    mount();
    expect(lastQuery()).toMatchObject({ variables: { locale: '' }, skip: true });
    expect(screen.getByText('0 translated')).toBeInTheDocument();
    expect(screen.getByText(EMPTY)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Translate everything with AI' })).toBeDisabled();
  });

  it('asks for nothing before the languages have loaded', () => {
    hooks.locales = undefined;
    hooks.translations = { data: undefined, loading: false };
    mount();
    expect(lastQuery()).toMatchObject({ variables: { locale: '' }, skip: true });
  });

  it('holds the table and its refresh while the rows load', () => {
    hooks.translations = { data: undefined, loading: true };
    mount();
    expect(screen.getByRole('button', { name: 'Refresh table' })).toBeDisabled();
    expect(screen.queryByText(EMPTY)).toBeNull();
  });

  it('reloads the rows from the refresh button', async () => {
    const user = mount();
    await user.click(screen.getByRole('button', { name: 'Refresh table' }));
    expect(hooks.refetch).toHaveBeenCalledTimes(1);
  });

  it('reloads after a saved correction, and shrugs off a reload that fails', async () => {
    hooks.setTranslation.mockResolvedValue({ data: undefined });
    hooks.refetch.mockRejectedValue(new Error('offline'));
    const user = mount();
    const field = screen.getByRole('textbox', { name: 'Translation of "Settings"' });
    await user.clear(field);
    await user.type(field, 'Réglages');
    await user.click(within(rowOf('Settings')).getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Translation saved')).toBeInTheDocument();
    expect(hooks.setTranslation).toHaveBeenCalledWith({
      variables: { locale: 'fr', source: 'Settings', text: 'Réglages' },
    });
    expect(hooks.refetch).toHaveBeenCalledTimes(1);
  });

  it('reloads once a translate-everything run starts, even if that reload fails', async () => {
    hooks.translate.mockResolvedValue({
      data: { translateEverything: { locale: 'fr', queued: 4, alreadyRunning: false } },
    });
    hooks.refetch.mockRejectedValue(new Error('offline'));
    const user = mount();
    await user.click(screen.getByRole('button', { name: 'Translate everything with AI' }));
    const dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByText('Translate everything into Français?')).toBeInTheDocument();
    await user.click(dialog.getByRole('button', { name: 'Translate everything' }));

    expect(
      await screen.findByText(
        'Translating 4 strings into Français. They appear here as they finish.',
      ),
    ).toBeInTheDocument();
    expect(hooks.translate).toHaveBeenCalledWith({ variables: { locale: 'fr' } });
    expect(hooks.refetch).toHaveBeenCalledTimes(1);
  });
});
