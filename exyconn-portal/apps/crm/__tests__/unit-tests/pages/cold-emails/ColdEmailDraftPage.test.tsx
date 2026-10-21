import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { ColdEmailDraftPage } from '../../../../src/pages/cold-emails';
import { useCommsDock } from '../../../../src/records/comms/commsStore';
import { renderWithProviders } from '../../test-utils';
import { resetDock } from '../../records/comms/comms-fixtures';
import { draft, variant } from '../../records/cold-email/cold-email-fixtures';

const gql = vi.hoisted(() => ({
  draft: vi.fn(),
  deleteVariant: vi.fn(),
  updateVariant: vi.fn(),
  addVariant: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useColdEmailDraftQuery: () => gql.draft(),
  useDeleteColdEmailVariantMutation: () => [gql.deleteVariant, { loading: false }],
  useUpdateColdEmailVariantMutation: () => [gql.updateVariant, { loading: false }],
  useAddColdEmailVariantMutation: () => [gql.addVariant, { loading: false }],
}));

const renderPage = () =>
  renderWithProviders(<ColdEmailDraftPage />, {
    route: '/cold-emails/draft-1',
    path: '/cold-emails/:id',
  });

describe('ColdEmailDraftPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => resetDock());

  it('lists every version newest first, with the draft and a link back to the record', () => {
    gql.draft.mockReturnValue({ data: { coldEmailDraft: draft([variant('v1'), variant('v2')]) } });
    renderPage();

    expect(screen.getByRole('heading', { name: 'Cold email to Acme' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Acme' })).toHaveAttribute('href', '/companies/co-1');
    expect(screen.getByText('A checkout audit')).toBeInTheDocument();
    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual(['Subject v2', 'Subject v1']);
    expect(screen.getByText('Versions (2)')).toBeInTheDocument();
  });

  it('opens the email dock prefilled with the chosen version, tracked against it', async () => {
    gql.draft.mockReturnValue({ data: { coldEmailDraft: draft([variant('v1')]) } });
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Use this' }));

    const { result } = renderHook(() => useCommsDock());
    expect(result.current.panels).toEqual([
      expect.objectContaining({
        channel: 'EMAIL',
        object: 'COMPANY',
        id: 'co-1',
        emails: ['hello@acme.com'],
        key: 'EMAIL:COMPANY:co-1:v1',
        coldEmail: { draftId: 'draft-1', variantId: 'v1', subject: 'Subject v1', body: 'Body v1' },
      }),
    ]);
  });

  it('locks a sent version: it says when it went out and cannot be edited, deleted or resent', () => {
    gql.draft.mockReturnValue({
      data: {
        coldEmailDraft: draft([variant('v1', { sentAt: '2026-10-19T11:00:00.000Z' })]),
      },
    });
    renderPage();

    const card = screen.getByRole('article');
    expect(within(card).getByText(/^Sent /)).toBeInTheDocument();
    for (const name of ['Use this', 'Edit', 'Delete']) {
      expect(within(card).getByRole('button', { name })).toBeDisabled();
    }
  });

  it('deletes a version once confirmed', async () => {
    gql.draft.mockReturnValue({ data: { coldEmailDraft: draft([variant('v1'), variant('v2')]) } });
    gql.deleteVariant.mockResolvedValue({});
    renderPage();

    const [newest] = screen.getAllByRole('article');
    await userEvent.click(within(newest).getByRole('button', { name: 'Delete' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(await within(dialog).findByRole('button', { name: 'Delete' }));

    expect(gql.deleteVariant).toHaveBeenCalledWith({
      variables: { draftId: 'draft-1', variantId: 'v2' },
    });
    expect(await screen.findByText('Version deleted')).toBeInTheDocument();
  });

  it('asks the AI for another version with the tweak typed', async () => {
    gql.draft.mockReturnValue({ data: { coldEmailDraft: draft([variant('v1')]) } });
    gql.addVariant.mockResolvedValue({});
    renderPage();

    await userEvent.type(screen.getByLabelText('What should change (optional)'), 'shorter');
    await userEvent.click(screen.getByRole('button', { name: 'Generate another version' }));

    expect(gql.addVariant).toHaveBeenCalledWith({
      variables: { id: 'draft-1', instruction: 'shorter', tone: 'FRIENDLY' },
    });
    expect(await screen.findByText('New version written')).toBeInTheDocument();
  });

  it('shows the error with a retry when the draft cannot load', async () => {
    const refetch = vi.fn().mockResolvedValue({});
    gql.draft.mockReturnValue({ data: undefined, error: new Error('Network down'), refetch });
    renderPage();

    expect(screen.getByText('Network down')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('holds the place while the draft loads', () => {
    gql.draft.mockReturnValue({ data: undefined });
    renderPage();
    expect(screen.getByLabelText('Loading the cold email')).toHaveAttribute('aria-busy', 'true');
  });

  it('edits a version in a side panel over the page', async () => {
    gql.draft.mockReturnValue({ data: { coldEmailDraft: draft([variant('v1'), variant('v2')]) } });
    renderPage();

    const [newest] = screen.getAllByRole('article');
    await userEvent.click(within(newest).getByRole('button', { name: 'Edit' }));

    const heading = await screen.findByRole('heading', { name: 'Edit version' });
    expect(
      within(heading.closest<HTMLElement>('.MuiDrawer-paper')!).getByDisplayValue('Subject v2'),
    ).toBeInTheDocument();
  });

  it('offers to rewrite the draft from the latest data', () => {
    gql.draft.mockReturnValue({ data: { coldEmailDraft: draft([variant('v1')]) } });
    renderPage();
    expect(screen.getByRole('button', { name: 'Rewrite based on latest data' })).toBeEnabled();
  });
});
