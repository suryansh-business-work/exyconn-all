import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test-utils';

const gql = vi.hoisted(() => ({ send: vi.fn(), loading: false }));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSendAdminCredentialsMutation: () => [gql.send, { loading: gql.loading }],
}));

const { AdminRecovery } = await import('../../../../../src/Login/forms/login/AdminRecovery');

const LABEL = 'No admin account? Email admin credentials';

async function clickRecovery() {
  const user = userEvent.setup();
  renderWithProviders(<AdminRecovery />);
  await user.click(screen.getByRole('button', { name: LABEL }));
}

describe('AdminRecovery', () => {
  beforeEach(() => {
    gql.send.mockReset();
    gql.loading = false;
  });

  it("notifies with the server's answer", async () => {
    gql.send.mockResolvedValue({ data: { sendAdminCredentials: 'Credentials sent to admin.' } });
    await clickRecovery();
    expect(await screen.findByText('Credentials sent to admin.')).toBeInTheDocument();
    expect(gql.send).toHaveBeenCalledTimes(1);
  });

  it('notifies a generic confirmation when the server says nothing', async () => {
    gql.send.mockResolvedValue({ data: null });
    await clickRecovery();
    expect(await screen.findByText('Request sent.')).toBeInTheDocument();
  });

  it('shows the error message when the request fails', async () => {
    gql.send.mockImplementation(async () => {
      throw new Error('An administrator already exists');
    });
    await clickRecovery();
    expect(await screen.findByText('An administrator already exists')).toBeInTheDocument();
  });

  it('shows a generic error for a non-Error failure', async () => {
    gql.send.mockImplementation(() => Promise.reject('offline'));
    await clickRecovery();
    expect(await screen.findByText('Could not send credentials.')).toBeInTheDocument();
  });

  it('is disabled and says so while the request is in flight', () => {
    gql.loading = true;
    renderWithProviders(<AdminRecovery />);
    const link = screen.getByRole('button', { name: 'Sending…' });
    expect(link).toBeDisabled();
    expect(screen.queryByRole('button', { name: LABEL })).toBeNull();
  });
});
