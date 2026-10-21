import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuth } from '@exyconn/shell/auth/AuthContext';
import { useMaAuthorizeExtensionMutation } from '@exyconn/shell/graphql/generated';
import { ConnectExtensionPage } from '../../../src/connect/ConnectExtensionPage';
import { mutationTuple, renderWithProviders, stubLocationAssign } from '../test-utils';

vi.mock('@exyconn/shell/graphql/generated', async (orig) => ({
  ...(await orig<typeof import('@exyconn/shell/graphql/generated')>()),
  useMaAuthorizeExtensionMutation: vi.fn(),
}));
vi.mock('@exyconn/shell/auth/AuthContext', () => ({ useAuth: vi.fn() }));

const REDIRECT = 'https://abcdefghijklmnopabcdefghijklmnop.chromiumapp.org/cb';
const query = (redirect = REDIRECT) =>
  `/me/meetings/connect-extension?client_id=ext&redirect_uri=${encodeURIComponent(redirect)}&code_challenge=abc&code_challenge_method=S256&state=xyz`;
const authorize = vi.fn();
const location = () => screen.getByRole('status', { name: 'location', hidden: true });

beforeEach(() => {
  authorize
    .mockReset()
    .mockResolvedValue({ data: { maAuthorizeExtension: `${REDIRECT}?code=one-time&state=xyz` } });
  vi.mocked(useMaAuthorizeExtensionMutation).mockReturnValue(mutationTuple(authorize) as never);
  vi.mocked(useAuth).mockReturnValue({ user: { email: 'asha@example.com' } } as never);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ConnectExtensionPage', () => {
  it('asks for consent as the signed-in person, with the privacy note', () => {
    renderWithProviders(<ConnectExtensionPage homePath="/me/meetings" />, { route: query() });
    expect(
      screen.getByRole('heading', {
        name: 'Exyconn Meeting Assistant wants to access your meetings as asha@example.com',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Recording starts only when you click Start/)).toBeInTheDocument();
  });

  it('issues the one-time code and hands the browser back to the extension on Allow', async () => {
    const assign = stubLocationAssign();
    renderWithProviders(<ConnectExtensionPage homePath="/me/meetings" />, { route: query() });
    await userEvent.click(screen.getByRole('button', { name: 'Allow' }));
    expect(authorize).toHaveBeenCalledWith({
      variables: {
        input: {
          extensionId: 'ext',
          redirectUri: REDIRECT,
          codeChallenge: 'abc',
          codeChallengeMethod: 'S256',
          state: 'xyz',
        },
      },
    });
    expect(assign).toHaveBeenCalledWith(`${REDIRECT}?code=one-time&state=xyz`);
  });

  it("shows the server's reason a sign-in failed, and stays put without a redirect", async () => {
    const assign = stubLocationAssign();
    authorize.mockRejectedValueOnce(new Error('Unknown extension'));
    renderWithProviders(<ConnectExtensionPage homePath="/me/meetings" />, { route: query() });
    await userEvent.click(screen.getByRole('button', { name: 'Allow' }));
    expect(await screen.findByText('Unknown extension')).toBeInTheDocument();
    authorize.mockResolvedValueOnce({ data: undefined });
    await userEvent.click(screen.getByRole('button', { name: 'Allow' }));
    expect(screen.queryByText('Unknown extension')).not.toBeInTheDocument();
    expect(assign).not.toHaveBeenCalled();
  });

  it('sends Cancel back to the extension with access_denied', async () => {
    const assign = stubLocationAssign();
    renderWithProviders(<ConnectExtensionPage homePath="/me/meetings" />, { route: query() });
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(assign).toHaveBeenCalledWith(`${REDIRECT}?error=access_denied&state=xyz`);
  });

  it('never redirects Cancel to an address that is not the extension', async () => {
    const assign = stubLocationAssign();
    renderWithProviders(<ConnectExtensionPage homePath="/me/meetings" />, {
      route: query('https://evil.example.com/cb'),
    });
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(assign).not.toHaveBeenCalled();
    expect(location()).toHaveTextContent(/^\/me\/meetings$/);
  });

  it('explains an incomplete sign-in link', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null } as never);
    renderWithProviders(<ConnectExtensionPage homePath="/me/meetings" />, {
      route: '/me/meetings/connect-extension?client_id=ext',
    });
    expect(screen.getByText('This sign-in link is incomplete')).toBeInTheDocument();
  });

  it('still asks for consent before the user has loaded', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null } as never);
    renderWithProviders(<ConnectExtensionPage homePath="/me/meetings" />, { route: query() });
    expect(screen.getByRole('button', { name: 'Allow' })).toBeInTheDocument();
  });
});
