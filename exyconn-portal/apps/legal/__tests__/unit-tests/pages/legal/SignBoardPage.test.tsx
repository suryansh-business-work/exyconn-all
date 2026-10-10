import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { SignBoardPage } from '../../../../src/pages/legal/SignBoardPage';
import type { ContractRow } from '../../../../src/pages/legal/forms/contract';
import { renderWithProviders } from '../../test-utils';
import { contractRow } from './legal.fixtures';

interface DashboardProps {
  title: string;
  stats: StatItem[];
  statsLoading: boolean;
  children: ReactNode;
}

interface FormStubProps {
  contract: ContractRow;
  onDone: () => void;
  onCancel: () => void;
}

const recorded = vi.hoisted(() => ({
  dashboard: null as unknown,
  contracts: vi.fn(),
  refetch: vi.fn(),
  warn: vi.fn(),
}));

vi.mock('@exyconn/shell/logging/portalLogger', () => ({ portalLogger: { warn: recorded.warn } }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListContractsQuery: recorded.contracts,
}));
vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('../../settings.mock')).settingsModuleMock(),
);
vi.mock('@exyconn/shell/components/dashboard/ModuleDashboard', () => ({
  ModuleDashboard: (props: Readonly<DashboardProps>) => {
    recorded.dashboard = props;
    return <main>{props.children}</main>;
  },
}));
vi.mock('../../../../src/pages/legal/forms/sign-contract', () => ({
  SignContractForm: ({ contract, onDone, onCancel }: Readonly<FormStubProps>) => (
    <div>
      <p>Signing form for {contract.title}</p>
      <button type="button" onClick={onDone}>
        Finish signing
      </button>
      <button type="button" onClick={onCancel}>
        Stop signing
      </button>
    </div>
  ),
}));
vi.mock('../../../../src/pages/legal/SignatureEvidence', () => ({
  SignatureEvidence: ({ contractId }: Readonly<{ contractId: string }>) => (
    <p>Evidence for {contractId}</p>
  ),
}));

const dashboard = () => recorded.dashboard as DashboardProps;
const tiles = () => Object.fromEntries(dashboard().stats.map((s) => [s.label, s.value]));

const ROWS = [
  contractRow({ signedBy: 'Asha Rao', signedAt: '2026-10-03T09:00:00.000Z' }),
  contractRow({ id: 'contract-2', title: 'Mutual NDA', signedBy: 'Dev Patel', signedAt: null }),
  contractRow({ id: 'contract-3', title: 'Statement of work' }),
];

const answer = (rows: ContractRow[] | undefined, loading = false) =>
  recorded.contracts.mockReturnValue({
    data: rows && { listContracts: rows },
    loading,
    refetch: recorded.refetch,
  });

/** Presses "sign" on the row with this title and returns the drawer that opens. */
async function openSigning(title: string) {
  const row = screen.getByText(title).closest('tr') as HTMLElement;
  await userEvent.click(within(row).getByRole('button', { name: 'sign contract' }));
  return screen.findByRole('heading', { name: 'Sign contract' });
}

describe('SignBoardPage', () => {
  beforeEach(() => {
    recorded.dashboard = null;
    recorded.refetch.mockReset().mockResolvedValue({ data: {} });
    answer(ROWS);
  });

  it('counts the contracts, the signed ones and those still awaiting a signature', () => {
    renderWithProviders(<SignBoardPage />);
    expect(dashboard().title).toBe('Sign Board');
    expect(tiles()).toEqual({ Total: '3', Signed: '2', Awaiting: '1' });
    expect(dashboard().statsLoading).toBe(false);
  });

  it('shows placeholders, not zeros, until the contracts first arrive', () => {
    answer(undefined, true);
    renderWithProviders(<SignBoardPage />);
    expect(dashboard().statsLoading).toBe(true);
    expect(tiles()).toEqual({ Total: '0', Signed: '0', Awaiting: '0' });
  });

  it('says who signed each contract and when, and marks the rest unsigned', () => {
    renderWithProviders(<SignBoardPage />);
    expect(screen.getByText('Asha Rao · on 2026-10-03T09:00:00.000Z')).toBeInTheDocument();
    expect(screen.getByText('Dev Patel ·')).toBeInTheDocument();
    expect(screen.getByText('Unsigned')).toBeInTheDocument();
  });

  it('says there is nothing to sign when there are no contracts', () => {
    answer([]);
    renderWithProviders(<SignBoardPage />);
    expect(screen.getByText('No contracts to sign.')).toBeInTheDocument();
  });

  it('opens the signing drawer on a contract, with who else has signed it beneath', async () => {
    renderWithProviders(<SignBoardPage />);
    expect(screen.queryByText(/Signing form for/)).not.toBeInTheDocument();

    await openSigning('Mutual NDA');
    expect(screen.getByText('Signing form for Mutual NDA')).toBeInTheDocument();
    expect(screen.getByText('Evidence for contract-2')).toBeInTheDocument();
  });

  it('re-reads the board, closes the drawer and confirms once signed', async () => {
    renderWithProviders(<SignBoardPage />);
    await openSigning('Statement of work');
    await userEvent.click(screen.getByRole('button', { name: 'Finish signing' }));

    expect(await screen.findByText('Signature recorded')).toBeInTheDocument();
    expect(recorded.refetch).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.queryByText('Signing form for Statement of work')).not.toBeInTheDocument(),
    );
  });

  it('closes the drawer without signing when the form is cancelled', async () => {
    renderWithProviders(<SignBoardPage />);
    await openSigning('Statement of work');
    await userEvent.click(screen.getByRole('button', { name: 'Stop signing' }));

    await waitFor(() =>
      expect(screen.queryByText('Evidence for contract-3')).not.toBeInTheDocument(),
    );
    expect(recorded.refetch).not.toHaveBeenCalled();
  });

  it('closes the drawer from its own close button', async () => {
    renderWithProviders(<SignBoardPage />);
    await openSigning('Statement of work');
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() =>
      expect(screen.queryByText('Signing form for Statement of work')).not.toBeInTheDocument(),
    );
  });

  it('reloads the board from the table refresh button', async () => {
    renderWithProviders(<SignBoardPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Refresh table' }));
    expect(recorded.refetch).toHaveBeenCalledTimes(1);
  });

  it('logs a failed re-read after signing and still confirms the signature', async () => {
    const failure = new Error('offline');
    recorded.refetch.mockRejectedValue(failure);
    renderWithProviders(<SignBoardPage />);
    await openSigning('Statement of work');
    await userEvent.click(screen.getByRole('button', { name: 'Finish signing' }));

    expect(await screen.findByText('Signature recorded')).toBeInTheDocument();
    await waitFor(() =>
      expect(recorded.warn).toHaveBeenCalledWith(
        'Could not reload the contracts after signing',
        failure,
      ),
    );
  });
});
