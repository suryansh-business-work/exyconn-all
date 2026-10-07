import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { renderWithProviders } from '../test-utils';
import { brandingResult } from '../branding';

const usePublicBrandingQuery = vi.hoisted(() => vi.fn());
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  usePublicBrandingQuery: () => usePublicBrandingQuery(),
}));

const { ResetPasswordPage } = await import('../../../src/ResetPassword/ResetPasswordPage');

const signIn = <Route path="/login" element={<p>sign-in page</p>} />;

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    usePublicBrandingQuery.mockReturnValue(brandingResult());
  });

  it('shows the new-password form when the link carries a token', () => {
    renderWithProviders(<ResetPasswordPage />, { route: '/reset-password?token=abc' });
    expect(screen.getByRole('heading', { name: 'Choose a new password' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('new password')).toBeInTheDocument();
    expect(screen.queryByText(/missing its reset token/)).toBeNull();
  });

  it('explains a link with no token instead of showing the form', () => {
    renderWithProviders(<ResetPasswordPage />, { route: '/reset-password' });
    expect(screen.getByText(/missing its reset token/)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('new password')).toBeNull();
  });

  it('treats an empty token as missing', () => {
    renderWithProviders(<ResetPasswordPage />, { route: '/reset-password?token=' });
    expect(screen.getByText(/missing its reset token/)).toBeInTheDocument();
  });

  it('links back to sign in', async () => {
    renderWithProviders(<ResetPasswordPage />, { route: '/reset-password', routes: signIn });
    await userEvent.setup().click(screen.getByRole('link', { name: 'Back to sign in' }));
    expect(await screen.findByText('sign-in page')).toBeInTheDocument();
  });
});
