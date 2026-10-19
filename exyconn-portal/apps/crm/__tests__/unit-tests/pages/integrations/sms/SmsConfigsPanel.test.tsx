import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CrmIntegrationStatusDocument, CrmSmsProvider } from '@exyconn/shell/graphql/generated';
import { SmsConfigsPanel } from '../../../../../src/pages/integrations/sms/SmsConfigsPanel';
import { renderWithProviders } from '../../../test-utils';
import { press } from '../../../form-helpers';
import { smsConfigRow } from '../integration-fixtures';

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
  useCrmSmsConfigsQuery: () => gql.configs(),
  useCrmIntegrationStatusQuery: () => gql.status(),
  useDeleteCrmSmsConfigMutation: (options: unknown) => {
    gql.deleteOptions(options);
    return [gql.remove];
  },
  useTestCrmSmsConfigMutation: () => [gql.test],
}));

vi.mock('../../../../../src/pages/integrations/forms/crm-sms-config', async () => ({
  CrmSmsConfigForm: (await import('../../../form-stub')).FormStub,
}));

const ROWS = [
  smsConfigRow(),
  smsConfigRow({
    id: 'sms-2',
    label: 'India texts',
    provider: CrmSmsProvider.Msg91,
    fromNumber: '',
    senderId: 'EXYCON',
    hasAuthToken: true,
    authTokenHint: 'k9',
    isActive: false,
  }),
];

function rowOf(label: string) {
  return screen.getByRole('cell', { name: label }).closest('tr') as HTMLElement;
}

describe('SmsConfigsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.remove.mockResolvedValue({ data: { deleteCrmSmsConfig: true } });
    gql.configs.mockReturnValue({
      data: { crmSmsConfigs: ROWS },
      loading: false,
      refetch: gql.refetch,
    });
    gql.status.mockReturnValue({
      data: { crmIntegrationStatus: { sms: { ready: true, provider: 'MSG91' } } },
    });
  });

  it('shows the number Twilio sends from and the sender id MSG91 sends as', () => {
    renderWithProviders(<SmsConfigsPanel />);

    expect(screen.getByText('Active account: MSG91')).toBeInTheDocument();
    const twilio = within(rowOf('Sales texts'));
    expect(twilio.getByText('+14155550100')).toBeInTheDocument();
    expect(twilio.getByText('••••')).toBeInTheDocument();
    expect(twilio.getByText('ACTIVE')).toBeInTheDocument();
    const msg91 = within(rowOf('India texts'));
    expect(msg91.getByText('EXYCON')).toBeInTheDocument();
    expect(msg91.getByText('••••k9')).toBeInTheDocument();
    expect(msg91.getByText('INACTIVE')).toBeInTheDocument();
  });

  it('shows the hint and the empty message before anything is connected', () => {
    gql.configs.mockReturnValue({ data: undefined, loading: false, refetch: gql.refetch });
    gql.status.mockReturnValue({ data: undefined });
    renderWithProviders(<SmsConfigsPanel />);

    expect(
      screen.getByText('Add an active Twilio or MSG91 account to text from record pages.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('No SMS account yet: the SMS button on records is off.'),
    ).toBeInTheDocument();
  });

  it('tests an account with the provider', async () => {
    gql.test.mockResolvedValue({ data: { testCrmSmsConfig: 'MSG91 key accepted' } });
    renderWithProviders(<SmsConfigsPanel />);

    await userEvent.click(
      within(rowOf('India texts')).getByRole('button', { name: 'test the credentials' }),
    );

    expect(gql.test).toHaveBeenCalledWith({ variables: { id: 'sms-2' } });
    expect(await screen.findByText('MSG91 key accepted')).toBeInTheDocument();
  });

  it('deletes an account once confirmed and refreshes the status with it', async () => {
    renderWithProviders(<SmsConfigsPanel />);

    await userEvent.click(within(rowOf('India texts')).getByRole('button', { name: 'delete' }));
    expect(
      await screen.findByText(
        'Delete SMS account "India texts"? Texts from records stop until another one is active.',
      ),
    ).toBeInTheDocument();
    await press('Delete');

    await waitFor(() => expect(gql.remove).toHaveBeenCalledWith({ variables: { id: 'sms-2' } }));
    expect(gql.deleteOptions).toHaveBeenCalledWith({
      refetchQueries: [CrmIntegrationStatusDocument],
    });
  });

  it('opens the SMS account form in place of the list', async () => {
    renderWithProviders(<SmsConfigsPanel />);

    await press('New SMS account');

    expect(screen.getByText('Blank form')).toBeInTheDocument();
    expect(screen.queryByRole('cell', { name: 'Sales texts' })).not.toBeInTheDocument();
  });
});
