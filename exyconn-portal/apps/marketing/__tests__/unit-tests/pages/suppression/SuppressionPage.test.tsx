import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListMarketingSuppressionsPagedDocument } from '@exyconn/shell/graphql/generated';
import { SuppressionPage } from '../../../../src/pages/suppression';
import { SUPPRESSION_COLUMNS } from '../../../../src/pages/suppression/suppression-grid';
import type { SuppressionDialog } from '../../../../src/pages/suppression/SuppressionDialogs';
import { renderWithProviders } from '../../test-utils';
import { answered, pending, suppressionRow } from '../../fixtures';
import { dashboardProps, paged } from '../../crud-dashboard-stub';
import { runRowAction, statLines } from '../../crud-page-helpers';

const gql = vi.hoisted(() => ({ summary: vi.fn(), refetch: vi.fn(), setArchived: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useMarketingSuppressionSummaryQuery: (options: unknown) => gql.summary(options),
  useSetMarketingSuppressionArchivedMutation: () => [gql.setArchived],
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../../crud-dashboard-stub');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('../../../../src/pages/suppression/forms/suppression', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  SuppressionForm: (await import('../../form-stub')).FormStub,
}));

/** Shows which dialog the page opened and exposes its close / changed callbacks. */
vi.mock('../../../../src/pages/suppression/SuppressionDialogs', () => ({
  SuppressionDialogs: ({
    dialog,
    onClose,
    onChanged,
  }: Readonly<{ dialog: SuppressionDialog; onClose: () => void; onChanged: () => void }>) => (
    <div>
      <p>
        {dialog ? `Dialog ${dialog.kind} ${'row' in dialog ? dialog.row.id : ''}` : 'No dialog'}
      </p>
      <button type="button" onClick={onClose}>
        Close dialog
      </button>
      <button type="button" onClick={onChanged}>
        Dialog changed
      </button>
    </div>
  ),
}));

const SUMMARY = {
  marketingSuppressionSummary: {
    total: 9,
    archived: 2,
    unsubscribed: 5,
    hardBounced: 3,
    addedManually: 1,
    updatedAt: '2026-10-01T10:00:00.000Z',
  },
};

const pagedRow = (overrides: Record<string, unknown> = {}) => ({
  ...suppressionRow(),
  linkedRecords: [],
  ...overrides,
});

describe('SuppressionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.setArchived.mockResolvedValue({ data: { setMarketingSuppressionArchived: true } });
    gql.summary.mockReturnValue({ ...answered(SUMMARY), refetch: gql.refetch });
  });

  it('reads the server summary fresh and shows each figure once', () => {
    renderWithProviders(<SuppressionPage />);

    expect(gql.summary).toHaveBeenCalledWith({ fetchPolicy: 'network-only' });
    expect(statLines()).toEqual([
      'Total suppressed: 9',
      'Unsubscribed: 5',
      'Hard bounced: 3',
      'Added manually: 1',
    ]);
    expect(dashboardProps().statsLoading).toBe(false);
    expect(screen.getByRole('status')).toHaveTextContent(/Archived addresses \(2\)/);
    expect(screen.getByRole('status')).toHaveTextContent(/Last updated/);
  });

  it('shows loading tiles at zero until the summary answers, with no update time', () => {
    gql.summary.mockReturnValue(pending());
    renderWithProviders(<SuppressionPage />);

    expect(dashboardProps().statsLoading).toBe(true);
    expect(statLines()).toEqual([
      'Total suppressed: 0',
      'Unsubscribed: 0',
      'Hard bounced: 0',
      'Added manually: 0',
    ]);
    expect(screen.getByRole('status')).not.toHaveTextContent(/Last updated/);
  });

  it('drives the server grid with the paged suppressions query', () => {
    renderWithProviders(<SuppressionPage />);
    const page = { totalCount: 1, rows: [pagedRow()] };

    expect(paged.document).toBe(ListMarketingSuppressionsPagedDocument);
    expect(paged.select?.({ listMarketingSuppressionsPaged: page } as never)).toBe(page);
    expect(dashboardProps().columnDefs).toBe(SUPPRESSION_COLUMNS);
    expect(Object.keys(dashboardProps().context.actions)).toEqual([
      'details',
      'note',
      'remove',
      'archive',
      'unarchive',
    ]);
    expect(dashboardProps()).toMatchObject({
      title: 'Suppression List',
      entityLabel: 'suppressed address',
      actionLabel: 'Add address',
      exportFileName: 'suppression-list',
      searchPlaceholder: 'Search email, contact or company…',
    });
  });

  it('opens a blank form to add an address, and re-reads the figures once saved', async () => {
    renderWithProviders(<SuppressionPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));
    expect(screen.getByText('Blank form')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
    expect(screen.queryByText('Blank form')).not.toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['details', 'Dialog details suppression-4'],
    ['note', 'Dialog note suppression-4'],
    ['remove', 'Dialog remove suppression-4'],
  ])('opens the %s dialog for the row', async (key, shown) => {
    renderWithProviders(<SuppressionPage />);
    await runRowAction(key, pagedRow({ id: 'suppression-4' }));
    expect(screen.getByText(shown)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Close dialog' }));
    expect(screen.getByText('No dialog')).toBeInTheDocument();
    expect(gql.refetch).not.toHaveBeenCalled();
  });

  it('opens bulk add from the toolbar and reloads once the dialog changes something', async () => {
    renderWithProviders(<SuppressionPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Suppress several' }));
    expect(screen.getByText(/Dialog bulk/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Dialog changed' }));
    expect(screen.getByText('No dialog')).toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('routes a plain delete to the justified removal dialog after confirming', async () => {
    renderWithProviders(<SuppressionPage />);
    const { remove } = dashboardProps().crud as unknown as {
      remove: (row: object) => Promise<void>;
    };
    let removal: Promise<void> = Promise.resolve();
    act(() => {
      removal = remove(pagedRow({ id: 'suppression-7' }));
    });
    expect(await screen.findByText('Remove gone@acme.io?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await act(async () => {
      await removal;
    });
    expect(screen.getByText('Dialog remove suppression-7')).toBeInTheDocument();
  });

  it('archives a row, which stays suppressed, and reloads', async () => {
    renderWithProviders(<SuppressionPage />);
    await runRowAction('archive', pagedRow({ id: 'suppression-2' }));

    expect(gql.setArchived).toHaveBeenCalledWith({
      variables: { id: 'suppression-2', archived: true },
    });
    expect(await screen.findByText('gone@acme.io archived — still suppressed')).toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('restores an archived row to the list', async () => {
    renderWithProviders(<SuppressionPage />);
    await runRowAction('unarchive', pagedRow({ id: 'suppression-2' }));

    expect(gql.setArchived).toHaveBeenCalledWith({
      variables: { id: 'suppression-2', archived: false },
    });
    expect(await screen.findByText('gone@acme.io restored to the list')).toBeInTheDocument();
  });

  it('says why an archive failed and does not reload', async () => {
    gql.setArchived.mockRejectedValue(new Error('Not allowed'));
    renderWithProviders(<SuppressionPage />);
    await runRowAction('archive', pagedRow());

    expect(await screen.findByText('Not allowed')).toBeInTheDocument();
    expect(gql.refetch).not.toHaveBeenCalled();
  });
});
