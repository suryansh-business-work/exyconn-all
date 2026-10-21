import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { RewriteDraftButton } from '../../../../src/records/cold-email';
import { renderWithProviders } from '../../test-utils';
import { draft, variant } from './cold-email-fixtures';

const gql = vi.hoisted(() => ({ rewrite: vi.fn(), firecrawlReady: false }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useRewriteColdEmailDraftMutation: () => [gql.rewrite],
  useFirecrawlReadyQuery: () => ({ data: { firecrawlReady: gql.firecrawlReady } }),
}));

const TWO = draft([variant('v1'), variant('v2')]);
const answered = (variants = [...TWO.variants, variant('v3'), variant('v4')]) => ({
  data: { rewriteColdEmailDraft: { ...TWO, variants } },
});

const TITLE = 'Rewrite based on latest data';

/** The side panel the form opens in, found by its heading. */
const panel = async () =>
  (await screen.findByRole('heading', { name: TITLE })).closest<HTMLElement>('.MuiDrawer-paper')!;

const openDialog = async () => {
  await userEvent.click(screen.getByRole('button', { name: TITLE }));
  return panel();
};

describe('RewriteDraftButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.firecrawlReady = false;
    vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
  });

  it('is off, and says why, when the draft holds all the versions it can', () => {
    renderWithProviders(<RewriteDraftButton draft={{ ...TWO, maxVariants: 2 }} />);
    expect(screen.getByRole('button', { name: 'Rewrite based on latest data' })).toBeDisabled();
    expect(
      screen.getByText('This draft holds 2 versions, the most it can. Delete some to rewrite it.'),
    ).toBeInTheDocument();
  });

  it('writes four new versions, or fewer when the draft has less room', async () => {
    const { unmount } = renderWithProviders(<RewriteDraftButton draft={TWO} />);
    expect(within(await openDialog()).getByText(/writes 4 new versions/)).toBeInTheDocument();
    unmount();

    renderWithProviders(<RewriteDraftButton draft={{ ...TWO, maxVariants: 3 }} />);
    expect(within(await openDialog()).getByText(/writes 1 new versions/)).toBeInTheDocument();
  });

  it('rewrites without reading the website when Firecrawl is not set up, then shows the first new version', async () => {
    gql.rewrite.mockResolvedValue(answered());
    const onRewritten = vi.fn();
    renderWithProviders(<RewriteDraftButton draft={TWO} onRewritten={onRewritten} />);

    const dialog = await openDialog();
    expect(within(dialog).queryByText('Read their website again')).toBeNull();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Rewrite' }));

    expect(gql.rewrite).toHaveBeenCalledWith({ variables: { id: 'draft-1', readWebsite: false } });
    expect(
      await screen.findByText('New versions written from the latest data'),
    ).toBeInTheDocument();
    expect(onRewritten).toHaveBeenCalledWith('v3');
  });

  it('reads their website again when Firecrawl is set up and it is switched on', async () => {
    gql.firecrawlReady = true;
    gql.rewrite.mockResolvedValue(answered());
    renderWithProviders(<RewriteDraftButton draft={TWO} />);

    const dialog = await openDialog();
    await userEvent.click(within(dialog).getByRole('switch', { name: /Read their website again/ }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Rewrite' }));

    expect(gql.rewrite).toHaveBeenCalledWith({ variables: { id: 'draft-1', readWebsite: true } });
  });

  it('shows the AI at work while it writes', async () => {
    gql.rewrite.mockReturnValue(new Promise(() => undefined));
    renderWithProviders(<RewriteDraftButton draft={TWO} />);

    const dialog = await openDialog();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Rewrite' }));

    expect(
      await within(dialog).findByRole('progressbar', { name: 'Writing the versions' }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText('The AI is writing 4 versions. This can take up to a minute.'),
    ).toBeInTheDocument();
  });

  it('closes without picking a version when the answer holds no new one', async () => {
    gql.rewrite.mockResolvedValue(answered(TWO.variants));
    const onRewritten = vi.fn();
    renderWithProviders(<RewriteDraftButton draft={TWO} onRewritten={onRewritten} />);

    await userEvent.click(within(await openDialog()).getByRole('button', { name: 'Rewrite' }));

    expect(
      await screen.findByText('New versions written from the latest data'),
    ).toBeInTheDocument();
    expect(onRewritten).not.toHaveBeenCalled();
  });

  it('says why the AI could not rewrite, logs it, and stays open', async () => {
    gql.rewrite.mockRejectedValue(new Error('AI budget spent'));
    renderWithProviders(<RewriteDraftButton draft={TWO} />);

    const dialog = await openDialog();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Rewrite' }));

    expect(await screen.findByText('AI budget spent')).toBeInTheDocument();
    expect(portalLogger.warn).toHaveBeenCalledWith(
      'crm: rewriting a cold email draft failed',
      expect.any(Error),
    );
    expect(screen.getByRole('heading', { name: TITLE })).toBeInTheDocument();
  });

  it('keeps the panel open when the server answers with no draft', async () => {
    gql.rewrite.mockResolvedValue({ data: null });
    const onRewritten = vi.fn();
    renderWithProviders(<RewriteDraftButton draft={TWO} onRewritten={onRewritten} />);

    await userEvent.click(within(await openDialog()).getByRole('button', { name: 'Rewrite' }));

    expect(
      await screen.findByText('New versions written from the latest data'),
    ).toBeInTheDocument();
    expect(onRewritten).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: TITLE })).toBeInTheDocument();
  });

  it('closes on Cancel', async () => {
    renderWithProviders(<RewriteDraftButton draft={TWO} />);
    await userEvent.click(within(await openDialog()).getByRole('button', { name: 'Cancel' }));
    await vi.waitFor(() => expect(screen.queryByRole('heading', { name: TITLE })).toBeNull());
  });
});
