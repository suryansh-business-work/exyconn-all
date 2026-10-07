import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PolicySignersDialog } from '../../../../src/pages/policies/PolicySignersDialog';
import type { PagedPolicyRow } from '../../../../src/pages/policies/policies-grid';
import { renderWithProviders } from '../../test-utils';
import { policyRow } from './policy.fixtures';

const gql = vi.hoisted(() => ({ query: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  usePolicyAcknowledgementsQuery: gql.query,
}));
vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('../../settings.mock')).settingsModuleMock(),
);

interface Acknowledgement {
  id: string;
  version: number;
  userName: string;
  userEmail: string;
  signedName: string;
  signedAt: string;
}

const acknowledgement = (overrides: Partial<Acknowledgement> = {}): Acknowledgement => ({
  id: 'ack-1',
  version: 3,
  userName: 'Asha Rao',
  userEmail: 'asha@acme.example',
  signedName: 'A. Rao',
  signedAt: '2026-05-01T10:00:00.000Z',
  ...overrides,
});

const answer = (rows: Acknowledgement[] | undefined, loading = false) =>
  gql.query.mockReturnValue({
    data: rows && { policyAcknowledgements: rows },
    loading,
    refetch: gql.refetch,
  });

const renderDialog = (policy: PagedPolicyRow | null, onClose = vi.fn()) =>
  renderWithProviders(<PolicySignersDialog policy={policy} onClose={onClose} />);

describe('PolicySignersDialog', () => {
  beforeEach(() => {
    gql.query.mockReset();
    gql.refetch.mockReset().mockResolvedValue({ data: {} });
    answer([]);
  });

  it('stays closed, and asks for nothing, until a policy is chosen', () => {
    renderDialog(null);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(gql.query).toHaveBeenCalledWith({
      variables: { policyId: '' },
      skip: true,
      fetchPolicy: 'cache-and-network',
    });
  });

  it('names the policy, its current version and how many have signed that version', () => {
    renderDialog(policyRow());
    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByText('Acceptable use')).toBeInTheDocument();
    expect(dialog.getByText('Currently v3 · 5 have signed this version')).toBeInTheDocument();
    expect(gql.query).toHaveBeenCalledWith({
      variables: { policyId: 'policy-1' },
      skip: false,
      fetchPolicy: 'cache-and-network',
    });
  });

  it('lists each signature with the version that was signed', () => {
    answer([
      acknowledgement(),
      acknowledgement({ id: 'ack-2', version: 2, userName: '', userEmail: 'dev@acme.example' }),
    ]);
    renderDialog(policyRow());

    const asha = screen.getByText('Asha Rao').closest('tr') as HTMLElement;
    expect(within(asha).getByText('A. Rao')).toBeInTheDocument();
    expect(within(asha).getByText('v3')).toBeInTheDocument();
    expect(within(asha).getByText('at 2026-05-01T10:00:00.000Z')).toBeInTheDocument();

    const dev = screen.getByText('dev@acme.example').closest('tr') as HTMLElement;
    expect(within(dev).getByText('v2')).toBeInTheDocument();
  });

  it('says nobody has signed yet when there are no signatures', () => {
    renderDialog(policyRow());
    expect(screen.getByText('Nobody has signed this policy yet.')).toBeInTheDocument();
  });

  it('shows placeholder rows while the signatures load', () => {
    answer(undefined, true);
    renderDialog(policyRow());
    expect(screen.getAllByTestId('table-skeleton-row').length).toBeGreaterThan(0);
  });

  it('re-reads the signatures from the table refresh button', async () => {
    renderDialog(policyRow());
    await userEvent.click(screen.getByRole('button', { name: 'Refresh table' }));
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape', async () => {
    const onClose = vi.fn();
    renderDialog(policyRow(), onClose);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
