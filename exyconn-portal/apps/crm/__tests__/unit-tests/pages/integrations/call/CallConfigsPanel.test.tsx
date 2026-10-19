import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CrmCallProvider, CrmIntegrationStatusDocument } from '@exyconn/shell/graphql/generated';
import { CallConfigsPanel } from '../../../../../src/pages/integrations/call/CallConfigsPanel';
import { renderWithProviders } from '../../../test-utils';
import { press } from '../../../form-helpers';
import { callConfigRow } from '../integration-fixtures';

const gql = vi.hoisted(() => ({
  configs: vi.fn(),
  status: vi.fn(),
  refetch: vi.fn(),
  remove: vi.fn(),
  test: vi.fn(),
  deleteOptions: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCrmCallConfigsQuery: () => gql.configs(),
  useCrmIntegrationStatusQuery: () => gql.status(),
  useDeleteCrmCallConfigMutation: (options: unknown) => {
    gql.deleteOptions(options);
    return [gql.remove];
  },
  useTestCrmCallConfigMutation: () => [gql.test],
}));

vi.mock('../../../../../src/pages/integrations/forms/crm-call-config', async () => ({
  CrmCallConfigForm: (await import('../../../form-stub')).FormStub,
}));

const ROWS = [
  callConfigRow(),
  callConfigRow({
    id: 'call-2',
    label: 'Backup line',
    provider: CrmCallProvider.Vobiz,
    hasAuthToken: false,
    authTokenHint: null,
    isActive: false,
  }),
];

function rowOf(label: string) {
  return screen.getByRole('cell', { name: label }).closest('tr') as HTMLElement;
}

describe('CallConfigsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.remove.mockResolvedValue({ data: { deleteCrmCallConfig: true } });
    gql.configs.mockReturnValue({
      data: { crmCallConfigs: ROWS },
      loading: false,
      refetch: gql.refetch,
    });
    gql.status.mockReturnValue({
      data: { crmIntegrationStatus: { call: { ready: true, provider: 'TWILIO' } } },
    });
  });

  it('lists each account with its provider, masked token and state', () => {
    renderWithProviders(<CallConfigsPanel />);

    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('Active account: Twilio')).toBeInTheDocument();
    const first = within(rowOf('Sales line'));
    expect(first.getByText('Twilio')).toBeInTheDocument();
    expect(first.getByText('••••a1b2')).toBeInTheDocument();
    expect(first.getByText('ACTIVE')).toBeInTheDocument();
    const second = within(rowOf('Backup line'));
    expect(second.getByText('Vobiz')).toBeInTheDocument();
    expect(second.getByText('—')).toBeInTheDocument();
    expect(second.getByText('INACTIVE')).toBeInTheDocument();
  });

  it('shows the hint and the empty message before anything is connected', () => {
    gql.configs.mockReturnValue({ data: undefined, loading: false, refetch: gql.refetch });
    gql.status.mockReturnValue({ data: undefined });
    renderWithProviders(<CallConfigsPanel />);

    expect(screen.getByText('Not connected')).toBeInTheDocument();
    expect(
      screen.getByText('Add an active Twilio or Vobiz account to call from record pages.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('No call account yet: the Call button on records is off.'),
    ).toBeInTheDocument();
  });

  it('reports what the provider said when the credentials pass', async () => {
    gql.test.mockResolvedValue({ data: { testCrmCallConfig: 'Twilio account is active' } });
    renderWithProviders(<CallConfigsPanel />);

    await userEvent.click(
      within(rowOf('Sales line')).getByRole('button', { name: 'test the credentials' }),
    );

    expect(gql.test).toHaveBeenCalledWith({ variables: { id: 'call-1' } });
    expect(await screen.findByText('Twilio account is active')).toBeInTheDocument();
  });

  it('falls back to a plain success, and reports a refusal', async () => {
    gql.test.mockResolvedValueOnce({ data: undefined });
    gql.test.mockRejectedValueOnce(new Error('Bad auth token'));
    renderWithProviders(<CallConfigsPanel />);
    const testButton = within(rowOf('Backup line')).getByRole('button', {
      name: 'test the credentials',
    });

    await userEvent.click(testButton);
    expect(await screen.findByText('The provider accepted the credentials')).toBeInTheDocument();

    await userEvent.click(testButton);
    expect(await screen.findByText('Bad auth token')).toBeInTheDocument();
  });

  it('confirms before deleting an account and refreshes the status with it', async () => {
    renderWithProviders(<CallConfigsPanel />);

    await userEvent.click(within(rowOf('Sales line')).getByRole('button', { name: 'delete' }));
    expect(
      await screen.findByText(
        'Delete call account "Sales line"? Calls from records stop until another one is active.',
      ),
    ).toBeInTheDocument();
    await press('Delete');

    await waitFor(() => expect(gql.remove).toHaveBeenCalledWith({ variables: { id: 'call-1' } }));
    expect(gql.deleteOptions).toHaveBeenCalledWith({
      refetchQueries: [CrmIntegrationStatusDocument],
    });
    expect(await screen.findByText('call account deleted')).toBeInTheDocument();
  });

  it('opens the form for a new account and goes back to the list', async () => {
    renderWithProviders(<CallConfigsPanel />);

    await press('New call account');
    expect(screen.getByText('Blank form')).toBeInTheDocument();
    expect(screen.getByText('New call account')).toBeInTheDocument();

    await press('Cancel form');
    expect(screen.getByRole('cell', { name: 'Sales line' })).toBeInTheDocument();
  });

  it('opens a stored account for editing and reloads when it is saved', async () => {
    renderWithProviders(<CallConfigsPanel />);

    await userEvent.click(within(rowOf('Backup line')).getByRole('button', { name: 'edit' }));
    expect(screen.getByText('Edit call account')).toBeInTheDocument();
    expect(screen.getByText(/Form for .*"id":"call-2"/)).toBeInTheDocument();

    await press('Finish form');
    expect(gql.refetch).toHaveBeenCalled();
    expect(screen.getByRole('cell', { name: 'Backup line' })).toBeInTheDocument();
  });
});
