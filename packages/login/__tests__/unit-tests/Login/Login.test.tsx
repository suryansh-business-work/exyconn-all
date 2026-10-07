import { screen } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { clearSession, makeUser, renderWithProviders } from '../test-utils';
import { BUNDLE, REGISTRY_NAME, brandingResult } from '../branding';

const usePublicBrandingQuery = vi.hoisted(() => vi.fn());
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  usePublicBrandingQuery: () => usePublicBrandingQuery(),
}));

const { Login } = await import('../../../src/Login/Login');

const landing = (
  <>
    <Route path="/dashboard" element={<p>dashboard</p>} />
    <Route path="/" element={<p>portal home</p>} />
  </>
);

describe('Login', () => {
  beforeEach(() => {
    usePublicBrandingQuery.mockReset();
    usePublicBrandingQuery.mockReturnValue(brandingResult());
  });

  afterEach(clearSession);

  it('shows the sign-in form for this portal to a signed-out visitor', async () => {
    renderWithProviders(<Login />, { route: '/login' });
    expect(
      screen.getByRole('heading', { name: `Sign in to ${REGISTRY_NAME}` }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e-mail address')).toBeInTheDocument();
    expect(screen.getByText('Authorized personnel only.')).toBeInTheDocument();
    expect(screen.queryByText(/Need access\?/)).toBeNull();
  });

  it('names the branded portal and offers the support address when one is set', () => {
    usePublicBrandingQuery.mockReturnValue(
      brandingResult({
        supportEmail: 'help@example.com',
        loginPages: [{ app: BUNDLE, name: 'Finance' }],
      }),
    );
    renderWithProviders(<Login />, { route: '/login' });
    expect(screen.getByRole('heading', { name: 'Sign in to Finance' })).toBeInTheDocument();
    expect(screen.getByText(/Need access\? help@example\.com/)).toBeInTheDocument();
  });

  it('sends a signed-in user on to the page they were after', () => {
    renderWithProviders(<Login />, {
      route: '/login?next=/dashboard',
      user: makeUser(),
      routes: landing,
    });
    expect(screen.getByText('dashboard')).toBeInTheDocument();
  });

  it('refuses an off-site next and lands a signed-in user on the portal home', () => {
    renderWithProviders(<Login />, {
      route: '/login?next=//evil.example',
      user: makeUser(),
      routes: landing,
    });
    expect(screen.getByText('portal home')).toBeInTheDocument();
  });

  it('opens the choose-a-new-password screen on the reset path', () => {
    renderWithProviders(<Login />, { route: '/reset-password?token=abc' });
    expect(screen.getByRole('heading', { name: 'Choose a new password' })).toBeInTheDocument();
  });

  it('still bounces a signed-in user away from the reset path', () => {
    renderWithProviders(<Login />, {
      route: '/reset-password?token=abc',
      user: makeUser(),
      routes: landing,
    });
    expect(screen.getByText('portal home')).toBeInTheDocument();
  });

  it('answers an unsubscribe link even for a signed-in user', () => {
    renderWithProviders(<Login />, { route: '/unsubscribe', user: makeUser(), routes: landing });
    expect(screen.getByRole('heading', { name: 'Unsubscribe' })).toBeInTheDocument();
    expect(screen.queryByText('portal home')).toBeNull();
  });
});
