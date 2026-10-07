import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContractStatus } from '@exyconn/shell/graphql/generated';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { LegalDashboardPage } from '../../../../src/pages/legal/LegalDashboardPage';
import type { ContractRow } from '../../../../src/pages/legal/forms/contract';
import type { LegalDocumentRow } from '../../../../src/pages/legal/forms/document';
import { renderWithProviders } from '../../test-utils';
import { contractRow, documentRow } from './legal.fixtures';

interface DashboardProps {
  title: string;
  subtitle: string;
  stats: StatItem[];
  statsLoading: boolean;
  children: ReactNode;
}

const recorded = vi.hoisted(() => ({
  dashboard: null as unknown,
  contracts: vi.fn(),
  documents: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListContractsQuery: recorded.contracts,
  useListLegalDocumentsQuery: recorded.documents,
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

const dashboard = () => recorded.dashboard as DashboardProps;
const tiles = () => Object.fromEntries(dashboard().stats.map((s) => [s.label, s.value]));

const answerContracts = (rows: ContractRow[] | undefined, loading = false) =>
  recorded.contracts.mockReturnValue({
    data: rows && { listContracts: rows },
    loading,
    refetch: recorded.refetch,
  });

const answerDocuments = (rows: LegalDocumentRow[] | undefined) =>
  recorded.documents.mockReturnValue({ data: rows && { listLegalDocuments: rows } });

/** Ten contracts, numbered, so the "first eight" cut is visible. */
const manyContracts = () =>
  Array.from({ length: 10 }, (_, index) =>
    contractRow({ id: `contract-${index + 1}`, title: `Contract number ${index + 1}` }),
  );

describe('LegalDashboardPage', () => {
  beforeEach(() => {
    recorded.dashboard = null;
    recorded.refetch.mockReset().mockResolvedValue({ data: {} });
    answerContracts([
      contractRow({ signedBy: 'Asha Rao' }),
      contractRow({ id: 'contract-2', title: 'Mutual NDA', status: ContractStatus.Draft }),
      contractRow({ id: 'contract-3', title: 'Statement of work' }),
    ]);
    answerDocuments([documentRow(), documentRow({ id: 'document-2' })]);
  });

  it('counts contracts, active and signed ones, and documents', () => {
    renderWithProviders(<LegalDashboardPage />);
    expect(dashboard().title).toBe('Legal');
    expect(dashboard().subtitle).toBe('Contracts & documents overview');
    expect(tiles()).toEqual({ Contracts: '3', Active: '2', Signed: '1', Documents: '2' });
    expect(dashboard().statsLoading).toBe(false);
  });

  it('shows placeholders, not zeros, until the contracts first arrive', () => {
    answerContracts(undefined, true);
    answerDocuments(undefined);
    renderWithProviders(<LegalDashboardPage />);
    expect(dashboard().statsLoading).toBe(true);
    expect(tiles()).toEqual({ Contracts: '0', Active: '0', Signed: '0', Documents: '0' });
  });

  it('lists each contract with its party, status and expiry in the viewer’s format', () => {
    renderWithProviders(<LegalDashboardPage />);
    const row = screen.getByText('Mutual NDA').closest('tr') as HTMLElement;
    expect(within(row).getByText('Acme Inc')).toBeInTheDocument();
    expect(within(row).getByText('on 2027-01-01T00:00:00.000Z')).toBeInTheDocument();
  });

  it('shows only the first eight contracts', () => {
    answerContracts(manyContracts());
    renderWithProviders(<LegalDashboardPage />);
    expect(screen.getByText('Contract number 8')).toBeInTheDocument();
    expect(screen.queryByText('Contract number 9')).not.toBeInTheDocument();
    expect(tiles().Contracts).toBe('10');
  });

  it('says there are no contracts yet when the list is empty', () => {
    answerContracts([]);
    renderWithProviders(<LegalDashboardPage />);
    expect(screen.getByText('No contracts yet.')).toBeInTheDocument();
  });

  it('reloads the contracts from the table refresh button', async () => {
    renderWithProviders(<LegalDashboardPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Refresh table' }));
    expect(recorded.refetch).toHaveBeenCalledTimes(1);
  });
});
