import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test-utils';
import { TranslateEverythingButton } from '../../../../src/pages/localization/TranslateEverythingButton';

const hooks = vi.hoisted(() => ({ translate: vi.fn(), loading: false }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useTranslateEverythingMutation: () => [hooks.translate, { loading: hooks.loading }],
}));

afterEach(() => {
  vi.resetAllMocks();
  hooks.loading = false;
});

const BUTTON = 'Translate everything with AI';

function mount(locale = 'fr') {
  const onStarted = vi.fn();
  const user = userEvent.setup();
  renderWithProviders(
    <TranslateEverythingButton locale={locale} languageLabel="Français" onStarted={onStarted} />,
  );
  return { user, onStarted };
}

/** Clicks the button and agrees in the confirmation that names the language. */
async function startAndConfirm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: BUTTON }));
  const dialog = within(await screen.findByRole('dialog'));
  expect(dialog.getByText('Translate everything into Français?')).toBeInTheDocument();
  await user.click(dialog.getByRole('button', { name: 'Translate everything' }));
}

const answer = (queued: number, alreadyRunning = false) => ({
  data: { translateEverything: { locale: 'fr', queued, alreadyRunning } },
});

describe('TranslateEverythingButton', () => {
  it('cannot start without a language', () => {
    mount('');
    expect(screen.getByRole('button', { name: BUTTON })).toBeDisabled();
  });

  it('is locked while the mutation is in flight', () => {
    hooks.loading = true;
    mount();
    expect(screen.getByRole('button', { name: BUTTON })).toBeDisabled();
  });

  it('spends nothing when the administrator backs out', async () => {
    const { user, onStarted } = mount();
    await user.click(screen.getByRole('button', { name: BUTTON }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancel' }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(hooks.translate).not.toHaveBeenCalled();
    expect(onStarted).not.toHaveBeenCalled();
  });

  it('says how many strings were queued and reloads the list', async () => {
    hooks.translate.mockResolvedValue(answer(12));
    const { user, onStarted } = mount();
    await startAndConfirm(user);
    expect(
      await screen.findByText(
        'Translating 12 strings into Français. They appear here as they finish.',
      ),
    ).toBeInTheDocument();
    expect(hooks.translate).toHaveBeenCalledWith({ variables: { locale: 'fr' } });
    expect(onStarted).toHaveBeenCalledTimes(1);
  });

  it('says a run is already under way rather than starting another', async () => {
    hooks.translate.mockResolvedValue(answer(0, true));
    const { user, onStarted } = mount();
    await startAndConfirm(user);
    expect(await screen.findByText('Français is already being translated.')).toBeInTheDocument();
    expect(onStarted).toHaveBeenCalledTimes(1);
  });

  it('says there is nothing left to translate when nothing was queued', async () => {
    hooks.translate.mockResolvedValue(answer(0));
    const { user } = mount();
    await startAndConfirm(user);
    expect(
      await screen.findByText('Everything is already translated into Français.'),
    ).toBeInTheDocument();
  });

  it('treats an answer without data as nothing left to translate', async () => {
    hooks.translate.mockResolvedValue({ data: undefined });
    const { user, onStarted } = mount();
    await startAndConfirm(user);
    expect(
      await screen.findByText('Everything is already translated into Français.'),
    ).toBeInTheDocument();
    expect(onStarted).toHaveBeenCalledTimes(1);
  });

  it('says why the run could not start, and does not reload', async () => {
    hooks.translate.mockRejectedValue(new Error('OpenAI key missing'));
    const { user, onStarted } = mount();
    await startAndConfirm(user);
    expect(await screen.findByText('OpenAI key missing')).toBeInTheDocument();
    expect(onStarted).not.toHaveBeenCalled();
  });

  it('falls back to its own words for a failure that is not an Error', async () => {
    hooks.translate.mockRejectedValue('timeout');
    const { user } = mount();
    await startAndConfirm(user);
    expect(await screen.findByText('Could not start the translation')).toBeInTheDocument();
  });
});
