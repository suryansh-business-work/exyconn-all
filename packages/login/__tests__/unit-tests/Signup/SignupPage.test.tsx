import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { clearSession, renderWithProviders } from '../test-utils';
import { brandingResult } from '../branding';
import { signupPlan } from './signup.fixtures';

const hooks = vi.hoisted(() => ({
  branding: vi.fn(),
  plans: vi.fn(),
  request: vi.fn(),
  complete: vi.fn(),
}));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  usePublicBrandingQuery: () => hooks.branding(),
  useSignupPlansQuery: () => hooks.plans(),
  useRequestSignupCodeMutation: () => [hooks.request],
  useCompleteSignupMutation: () => [hooks.complete],
}));

const { SignupPage } = await import('../../../src/Signup/SignupPage');
const { Login } = await import('../../../src/Login/Login');

const plansResult = (overrides: Record<string, unknown> = {}) => ({
  data: { signupPlans: [signupPlan()] },
  loading: false,
  error: undefined,
  ...overrides,
});

beforeEach(() => {
  hooks.branding.mockReturnValue(brandingResult());
  hooks.plans.mockReturnValue(plansResult());
});
afterEach(() => {
  vi.resetAllMocks();
  clearSession();
});

describe('SignupPage', () => {
  it('waits for the plans', () => {
    hooks.plans.mockReturnValue(plansResult({ data: undefined, loading: true }));
    renderWithProviders(<SignupPage />, { route: '/signup' });
    expect(screen.getByRole('heading', { name: 'Create your company' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('says when the plans could not be loaded', () => {
    hooks.plans.mockReturnValue(plansResult({ data: undefined, error: new Error('down') }));
    renderWithProviders(<SignupPage />, { route: '/signup' });
    expect(screen.getByRole('alert')).toHaveTextContent(
      'The plans could not be loaded. Try again shortly.',
    );
  });

  it('says sign-up is closed while no plan is offered', () => {
    hooks.plans.mockReturnValue(plansResult({ data: { signupPlans: [] } }));
    renderWithProviders(<SignupPage />, { route: '/signup' });
    expect(
      screen.getByText('Sign-up is not open yet. Contact us to get started.'),
    ).toBeInTheDocument();
  });

  it('moves to the code step once the code is sent, and back to start over', async () => {
    hooks.request.mockResolvedValue({ data: { requestSignupCode: true } });
    const user = userEvent.setup();
    renderWithProviders(<SignupPage />, { route: '/signup' });

    await user.type(screen.getByRole('textbox', { name: /Your name/ }), 'Ada Lovelace');
    await user.type(screen.getByRole('textbox', { name: /Work email/ }), 'ada@newco.example');
    await user.type(screen.getByRole('textbox', { name: /Company name/ }), 'New Co');
    await user.type(screen.getByRole('combobox', { name: /Currency/ }), 'GBP');
    await user.click(await screen.findByRole('option', { name: /^GBP/ }));
    await user.click(screen.getByRole('button', { name: 'Email me a code' }));

    expect(
      await screen.findByText('We sent a six-digit code to ada@newco.example.'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Use a different email' }));
    expect(screen.getByRole('button', { name: 'Email me a code' })).toBeInTheDocument();
  });

  it('links back to sign in', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignupPage />, {
      route: '/signup',
      routes: <Route path="/login" element={<p>sign-in page</p>} />,
    });
    await user.click(screen.getByRole('link', { name: 'Sign in' }));
    expect(await screen.findByText('sign-in page')).toBeInTheDocument();
  });
});

describe('Login and sign-up', () => {
  it('opens sign-up on its own path', () => {
    renderWithProviders(<Login />, { route: '/signup' });
    expect(screen.getByRole('heading', { name: 'Create your company' })).toBeInTheDocument();
  });

  it('offers new companies the way to sign up from the sign-in screen', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />, { route: '/login' });
    const offer = screen.getByText(/New to the portal\?/);
    await user.click(within(offer).getByRole('link', { name: 'Create your company' }));
    expect(await screen.findByRole('heading', { name: 'Create your company' })).toBeInTheDocument();
  });
});
