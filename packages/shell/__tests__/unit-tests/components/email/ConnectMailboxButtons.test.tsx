import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CrmEmailProvider, useStartMyMailboxConnectMutation } from '@/graphql/generated';
import { ConnectMailboxButtons } from '@/components/email';
import { renderWithProviders } from '../../test-utils';
import { mutationTuple } from '../../pages/hookMocks';

vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  useStartMyMailboxConnectMutation: vi.fn(),
}));

const start = vi.fn();
const assign = vi.fn();
const BOTH = { gmail: true, microsoft: true };

describe('ConnectMailboxButtons', () => {
  beforeEach(() => {
    vi.mocked(useStartMyMailboxConnectMutation).mockReturnValue(
      mutationTuple(start) as unknown as ReturnType<typeof useStartMyMailboxConnectMutation>,
    );
    vi.stubGlobal('location', { href: 'https://hr.exyconn.com/people', assign });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    start.mockReset();
    assign.mockReset();
  });

  it('goes to the provider consent page, to come back to the page it left', async () => {
    start.mockResolvedValue({ data: { startMyMailboxConnect: 'https://accounts.google.com/x' } });
    renderWithProviders(<ConnectMailboxButtons providers={BOTH} />);

    await userEvent.click(screen.getByRole('button', { name: 'Connect Gmail' }));

    expect(start).toHaveBeenCalledWith({
      variables: {
        provider: CrmEmailProvider.Gmail,
        returnTo: 'https://hr.exyconn.com/people?myMailbox=1',
        loginHint: undefined,
      },
    });
    await vi.waitFor(() => expect(assign).toHaveBeenCalledWith('https://accounts.google.com/x'));
  });

  it('stays put when no consent page comes back', async () => {
    start.mockResolvedValue({ data: { startMyMailboxConnect: '' } });
    renderWithProviders(<ConnectMailboxButtons providers={{ gmail: false, microsoft: true }} />);

    await userEvent.click(screen.getByRole('button', { name: 'Connect Microsoft' }));

    expect(screen.queryByRole('button', { name: 'Connect Gmail' })).not.toBeInTheDocument();
    await vi.waitFor(() => expect(start).toHaveBeenCalled());
    expect(assign).not.toHaveBeenCalled();
  });

  it('says why when the connection cannot start', async () => {
    start.mockRejectedValue(new Error('Email accounts are not available yet.'));
    renderWithProviders(<ConnectMailboxButtons providers={BOTH} />);

    await userEvent.click(screen.getByRole('button', { name: 'Connect Microsoft' }));

    expect(await screen.findByText('Email accounts are not available yet.')).toBeInTheDocument();
  });

  it('asks for the administrator while no provider is set up', () => {
    renderWithProviders(<ConnectMailboxButtons providers={{ gmail: false, microsoft: false }} />);

    expect(
      screen.getByText('Email accounts are not available yet. Ask your administrator.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
