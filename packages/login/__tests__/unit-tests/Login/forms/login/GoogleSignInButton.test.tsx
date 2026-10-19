import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test-utils';

const gql = vi.hoisted(() => ({ enabled: vi.fn(), start: vi.fn() }));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useGoogleSignInEnabledQuery: gql.enabled,
  useStartGoogleSignInMutation: () => [gql.start],
}));

const { GoogleSignInButton } = await import(
  '../../../../../src/Login/forms/login/GoogleSignInButton'
);

const PAGE = 'https://hub.example.test/login?next=%2Fdashboard&googleTicket=old&googleError=denied';
const GOOGLE = 'https://accounts.google.example/o/oauth2?state=abc';

function renderButton() {
  const onError = vi.fn();
  renderWithProviders(<GoogleSignInButton onError={onError} />);
  return { onError, user: userEvent.setup() };
}

const button = () => screen.getByRole('button', { name: 'Continue with Google' });

describe('GoogleSignInButton', () => {
  const assign = vi.fn();

  beforeEach(() => {
    gql.enabled.mockReset().mockReturnValue({ data: { googleSignInEnabled: true } });
    gql.start.mockReset();
    assign.mockReset();
    vi.stubGlobal('location', { href: PAGE, assign });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    ['switched off', { data: { googleSignInEnabled: false } }],
    ['still loading', { data: undefined }],
  ])('renders nothing while Google sign-in is %s', (_label, result) => {
    gql.enabled.mockReturnValue(result);
    renderButton();
    expect(screen.queryByRole('button', { name: 'Continue with Google' })).not.toBeInTheDocument();
    expect(screen.queryByText('or')).not.toBeInTheDocument();
  });

  it('sends the browser to Google with a return address free of earlier outcomes', async () => {
    gql.start.mockResolvedValue({ data: { startGoogleSignIn: GOOGLE } });
    const { onError, user } = renderButton();
    expect(screen.getByText('or')).toBeInTheDocument();
    await user.click(button());
    expect(gql.start).toHaveBeenCalledWith({
      variables: { returnTo: 'https://hub.example.test/login?next=%2Fdashboard' },
    });
    expect(assign).toHaveBeenCalledWith(GOOGLE);
    expect(onError).not.toHaveBeenCalled();
  });

  it('stays on the page when the server returns no address', async () => {
    gql.start.mockResolvedValue({ data: { startGoogleSignIn: null } });
    const { onError, user } = renderButton();
    await user.click(button());
    expect(gql.start).toHaveBeenCalledTimes(1);
    expect(assign).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it("reports the server's reason and lets the person try again", async () => {
    gql.start.mockRejectedValue(new Error('Google sign-in is not configured'));
    const { onError, user } = renderButton();
    await user.click(button());
    expect(onError).toHaveBeenCalledWith('Google sign-in is not configured');
    expect(button()).toBeEnabled();
    expect(assign).not.toHaveBeenCalled();
  });

  it('reports a generic reason for a non-Error failure', async () => {
    gql.start.mockRejectedValue('offline');
    const { onError, user } = renderButton();
    await user.click(button());
    expect(onError).toHaveBeenCalledWith('Google sign-in failed');
  });
});
