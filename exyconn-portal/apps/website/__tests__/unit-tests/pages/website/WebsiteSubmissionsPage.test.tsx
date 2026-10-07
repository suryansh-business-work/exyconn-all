import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListWebsiteSubmissionsPagedDocument } from '@exyconn/shell/graphql/generated';
import { WebsiteSubmissionsPage } from '../../../../src/pages/website/WebsiteSubmissionsPage';
import { SUBMISSION_COLUMNS } from '../../../../src/pages/website/submissions-grid';
import { renderWithProviders } from '../../test-utils';
import { dashboardProps, paged, statValues } from './content-dashboard-stub';
import {
  confirmRowDelete,
  pendingQuery,
  runRowAction,
  startRowAction,
  tableStats,
} from './content-page-helpers';
import { submissionRow } from './content-fixtures';

const gql = vi.hoisted(() => ({
  stats: vi.fn(),
  refetch: vi.fn(),
  deleteSubmission: vi.fn(),
  convert: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListWebsiteSubmissionsStatsQuery: () => gql.stats(),
  useDeleteWebsiteSubmissionMutation: () => [gql.deleteSubmission],
  useConvertWebsiteSubmissionToLeadMutation: () => [gql.convert],
  useWebsiteFormTypesQuery: () => ({ data: { websiteFormTypes: ['contact', 'careers'] } }),
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('./content-dashboard-stub');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('@exyconn/shell/hooks/useSettings', () => ({
  useSettings: () => ({ formatDate: (value: string) => `on ${value}` }),
}));

vi.mock('../../../../src/pages/website/forms/submission-triage', () => ({
  SubmissionTriageForm: ({
    submission,
    onDone,
  }: Readonly<{ submission: { id: string }; onDone: () => void }>) => (
    <button type="button" onClick={onDone}>
      {`Triage ${submission.id}`}
    </button>
  ),
}));

/** Starts a conversion and answers the confirm dialog with `answer`. */
async function convertWith(answer: 'Convert' | 'Cancel', row = submissionRow()) {
  const settle = startRowAction('convert', row);
  expect(
    await screen.findByText('File this contact submission as a CRM lead?'),
  ).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: answer }));
  await settle();
}

describe('WebsiteSubmissionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.deleteSubmission.mockResolvedValue({ data: { deleteWebsiteSubmission: true } });
    gql.convert.mockResolvedValue({ data: { convertWebsiteSubmissionToLead: { name: 'Asha' } } });
    gql.stats.mockReturnValue({
      data: {
        listWebsiteSubmissionsStats: tableStats(25, {
          status: { new: 6, 'in-review': 4, resolved: 12 },
        }),
      },
      loading: false,
      refetch: gql.refetch,
    });
  });

  it('counts every submission and each triage status', () => {
    renderWithProviders(<WebsiteSubmissionsPage />);

    expect(statValues()).toEqual({ Submissions: '25', New: '6', 'In review': '4', Resolved: '12' });
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('marks the tiles loading until the stats answer', () => {
    gql.stats.mockReturnValue(pendingQuery());
    renderWithProviders(<WebsiteSubmissionsPage />);

    expect(dashboardProps().statsLoading).toBe(true);
    expect(statValues().Submissions).toBe('0');
  });

  it('drives the server grid with the paged submissions query and no create button', () => {
    renderWithProviders(<WebsiteSubmissionsPage />);
    const page = { totalCount: 1, rows: [submissionRow()] };

    expect(paged.document).toBe(ListWebsiteSubmissionsPagedDocument);
    expect(paged.select?.({ listWebsiteSubmissionsPaged: page } as never)).toBe(page);
    expect(paged.extraFilters).toEqual([]);
    expect(dashboardProps().columnDefs).toBe(SUBMISSION_COLUMNS);
    expect(dashboardProps().crud).toBeUndefined();
    expect(screen.queryByRole('button', { name: 'Open new form' })).not.toBeInTheDocument();
    expect(dashboardProps().context.formatDate?.('2026-05-01')).toBe('on 2026-05-01');
  });

  it('scopes the grid to one form and reloads it when a form is picked', async () => {
    renderWithProviders(<WebsiteSubmissionsPage />);
    const before = dashboardProps().refreshSignal ?? 0;

    await userEvent.click(screen.getByRole('button', { name: 'careers' }));

    expect(paged.extraFilters).toEqual([{ field: 'formType', op: 'EQUALS', value: 'careers' }]);
    await waitFor(() => expect(dashboardProps().refreshSignal).toBe(before + 1));
  });

  it('files a submission as a CRM lead after confirming', async () => {
    renderWithProviders(<WebsiteSubmissionsPage />);
    const before = dashboardProps().refreshSignal ?? 0;

    await convertWith('Convert', submissionRow({ id: 'sub-7' }));

    expect(gql.convert).toHaveBeenCalledWith({ variables: { id: 'sub-7' } });
    expect(await screen.findByText('Lead "Asha" created in the CRM')).toBeInTheDocument();
    expect(dashboardProps().refreshSignal).toBe(before + 1);
  });

  it('names no lead when the server answers without one', async () => {
    gql.convert.mockResolvedValue({ data: null });
    renderWithProviders(<WebsiteSubmissionsPage />);

    await convertWith('Convert');

    expect(await screen.findByText('Lead "" created in the CRM')).toBeInTheDocument();
  });

  it('converts nothing when the confirm is cancelled', async () => {
    renderWithProviders(<WebsiteSubmissionsPage />);

    await convertWith('Cancel');

    expect(gql.convert).not.toHaveBeenCalled();
  });

  it('reports why a conversion failed', async () => {
    gql.convert.mockRejectedValue(new Error('Submission already converted'));
    renderWithProviders(<WebsiteSubmissionsPage />);

    await convertWith('Convert');

    expect(await screen.findByText('Submission already converted')).toBeInTheDocument();
  });

  it('falls back to a generic message for a failure that is not an Error', async () => {
    gql.convert.mockRejectedValue('offline');
    renderWithProviders(<WebsiteSubmissionsPage />);

    await convertWith('Convert');

    expect(await screen.findByText('Conversion failed')).toBeInTheDocument();
  });

  it('opens the triage drawer with what was sent and closes it when triaged', async () => {
    renderWithProviders(<WebsiteSubmissionsPage />);

    await runRowAction('edit', submissionRow({ id: 'sub-3' }));

    expect(await screen.findByRole('heading', { name: 'Triage submission' })).toBeInTheDocument();
    expect(screen.getByText('What they sent')).toBeInTheDocument();
    expect(screen.getByText('Pricing')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Triage sub-3' }));
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Triage sub-3' })).not.toBeInTheDocument(),
    );
  });

  it('deletes a submission after confirming and re-reads the stats', async () => {
    renderWithProviders(<WebsiteSubmissionsPage />);
    gql.refetch.mockClear();

    await confirmRowDelete(submissionRow({ id: 'sub-4' }), 'Delete this contact submission?');

    expect(gql.deleteSubmission).toHaveBeenCalledWith({ variables: { id: 'sub-4' } });
    expect(await screen.findByText('Submission deleted')).toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });
});
