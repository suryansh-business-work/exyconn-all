import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListContractsPagedDocument } from '@exyconn/shell/graphql/generated';
import { ContractsPage } from '../../../../src/pages/legal/ContractsPage';
import { ContractForm, type ContractRow } from '../../../../src/pages/legal/forms/contract';
import { CONTRACT_COLUMNS } from '../../../../src/pages/legal/contract-grid';
import { renderWithProviders } from '../../test-utils';
import {
  crud,
  dashboardProps,
  fetchRows,
  page,
  resetCrudPage,
  resourceOptions,
  statValues,
} from '../../crud-page.mocks';
import { formatDate } from '../../settings.mock';
import { contractRow, tableStats } from './legal.fixtures';

interface RequestStubProps {
  contract: ContractRow;
  onDone: () => void;
  onCancel: () => void;
}

const gql = vi.hoisted(() => ({
  stats: vi.fn(),
  remove: vi.fn(),
  lazy: vi.fn(),
  loadBody: vi.fn(),
  refetch: vi.fn(),
  save: vi.fn(),
}));

vi.mock('@exyconn/crud', async () => (await import('../../crud-page.mocks')).crudModuleMock());
vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('../../settings.mock')).settingsModuleMock(),
);
vi.mock('@exyconn/shell/hooks/useRichTextExport', () => ({ useRichTextExport: () => gql.save }));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListContractsStatsQuery: gql.stats,
  useDeleteContractMutation: () => [gql.remove],
  useGetContractBodyLazyQuery: gql.lazy,
}));
vi.mock('../../../../src/pages/legal/forms/contract', () => ({ ContractForm: () => null }));
vi.mock('../../../../src/pages/legal/forms/request-signature', () => ({
  RequestSignatureForm: ({ contract, onDone, onCancel }: Readonly<RequestStubProps>) => (
    <div>
      <p>Request for {contract.title}</p>
      <button type="button" onClick={onDone}>
        Request sent
      </button>
      <button type="button" onClick={onCancel}>
        Never mind
      </button>
    </div>
  ),
}));

const ROW = contractRow();

const answerStats = (data: object | undefined, loading = false) =>
  gql.stats.mockReturnValue({ data, loading, refetch: gql.refetch });

/** Presses a download action on ROW and runs the body fetch it handed the exporter. */
function downloadBody(action: 'pdf' | 'docx'): Promise<string> {
  dashboardProps().context.actions[action](ROW);
  const source = gql.save.mock.lastCall?.[0] as () => Promise<string>;
  return source();
}

describe('ContractsPage', () => {
  beforeEach(() => {
    resetCrudPage();
    gql.remove.mockReset().mockResolvedValue({ data: { deleteContract: true } });
    gql.loadBody.mockReset();
    gql.lazy.mockReset().mockReturnValue([gql.loadBody]);
    gql.save.mockReset().mockResolvedValue(undefined);
    answerStats(undefined, true);
  });

  it('frames the contracts register under the Contract permission', () => {
    renderWithProviders(<ContractsPage />);
    expect(dashboardProps()).toMatchObject({
      title: 'Contracts',
      subtitle: 'Create, send & track contracts',
      entityLabel: 'contract',
      exportFileName: 'contracts',
      permissionModule: 'Contract',
      searchPlaceholder: 'Search contracts…',
      crud,
      fetchRows,
    });
    expect(dashboardProps().columnDefs).toBe(CONTRACT_COLUMNS);
    expect(dashboardProps().context.formatDate).toBe(formatDate);
    expect(dashboardProps().context.actions.edit).toBe(crud.openEdit);
    expect(dashboardProps().context.actions.delete).toBe(crud.remove);
  });

  it('shows placeholders until the stats first answer', () => {
    renderWithProviders(<ContractsPage />);
    expect(dashboardProps().statsLoading).toBe(true);
    expect(statValues()).toEqual({ Total: '0', Active: '0', Draft: '0', Signed: '0' });
  });

  it('counts signed contracts as every contract minus those nobody has signed', () => {
    answerStats({
      listContractsStats: tableStats(9, {
        status: { ACTIVE: 5, DRAFT: 3 },
        signedBy: { null: 6, 'asha@acme.example': 3 },
      }),
    });
    renderWithProviders(<ContractsPage />);
    expect(statValues()).toEqual({ Total: '9', Active: '5', Draft: '3', Signed: '3' });
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('deletes a contract by id after confirming by title, then reloads its stats', async () => {
    renderWithProviders(<ContractsPage />);
    const options = resourceOptions();
    expect(options.label).toBe('Contract');
    expect(options.refetch).toBe(gql.refetch);
    expect(options.confirmMessage(ROW)).toEqual({
      message: 'Delete contract "{title}"?',
      values: { title: 'Master services agreement' },
    });
    await options.onDelete(ROW);
    expect(gql.remove).toHaveBeenCalledWith({ variables: { id: 'contract-1' } });
  });

  it('reads its grid rows from the paged contracts query', () => {
    renderWithProviders(<ContractsPage />);
    const paged = { rows: [ROW], totalCount: 1 };
    expect(page.fetcher?.document).toBe(ListContractsPagedDocument);
    expect(page.fetcher?.select({ listContractsPaged: paged })).toBe(paged);
  });

  it('opens the contract form on a record, wired to close and to reload when done', () => {
    renderWithProviders(<ContractsPage />);
    const form = dashboardProps().renderForm(ROW);
    expect(form.type).toBe(ContractForm);
    expect(form.props).toEqual({ initial: ROW, onCancel: crud.close, onDone: crud.onDone });
  });

  it('downloads a contract by fetching its text fresh from the server', async () => {
    gql.loadBody.mockResolvedValue({ data: { getContract: { content: '<p>Terms</p>' } } });
    renderWithProviders(<ContractsPage />);
    expect(gql.lazy).toHaveBeenCalledWith({ fetchPolicy: 'network-only' });

    await expect(downloadBody('pdf')).resolves.toBe('<p>Terms</p>');
    expect(gql.save).toHaveBeenLastCalledWith(expect.any(Function), ROW.title, 'pdf');
    expect(gql.loadBody).toHaveBeenCalledWith({ variables: { id: 'contract-1' } });
  });

  it('downloads an empty document when the contract has no text', async () => {
    gql.loadBody.mockResolvedValueOnce({ data: { getContract: { content: null } } });
    gql.loadBody.mockResolvedValueOnce({ data: undefined });
    renderWithProviders(<ContractsPage />);
    await expect(downloadBody('docx')).resolves.toBe('');
    await expect(downloadBody('docx')).resolves.toBe('');
  });

  it('fails the download when the text cannot be fetched', async () => {
    gql.loadBody.mockResolvedValue({ data: undefined, error: new Error('Not allowed') });
    renderWithProviders(<ContractsPage />);
    await expect(downloadBody('pdf')).rejects.toThrow('Not allowed');
  });

  it('sends a contract for signature from the grid, then reloads the grid', async () => {
    renderWithProviders(<ContractsPage />);
    expect(screen.queryByText(/Request for/)).not.toBeInTheDocument();

    act(() => {
      dashboardProps().context.actions.send(ROW);
    });
    expect(await screen.findByRole('heading', { name: 'Send for signature' })).toBeInTheDocument();
    expect(screen.getByText('Request for Master services agreement')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Request sent' }));
    expect(crud.reload).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByText(/Request for/)).not.toBeInTheDocument());
  });

  it('closes the signature request without reloading when it is cancelled', async () => {
    renderWithProviders(<ContractsPage />);
    act(() => {
      dashboardProps().context.actions.send(ROW);
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Never mind' }));

    await waitFor(() => expect(screen.queryByText(/Request for/)).not.toBeInTheDocument());
    expect(crud.reload).not.toHaveBeenCalled();
  });
});
