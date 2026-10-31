import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { tokenStore } from '@exyconn/shell/auth/tokenStore';
import { clearSession, makeSessionToken, makeUser, renderWithProviders } from '../test-utils';
import { DETAILS } from './signup.fixtures';

const complete = vi.hoisted(() => vi.fn());
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCompleteSignupMutation: () => [complete],
}));

const { SignupCodeForm } = await import('../../../src/Signup/forms/signup-code');

function mount(details = DETAILS) {
  const onStartOver = vi.fn();
  const user = userEvent.setup();
  renderWithProviders(
    <SignupCodeForm details={details} accentColor="#1a237e" onStartOver={onStartOver} />,
    { route: '/signup', routes: <Route path="/" element={<p>portal home</p>} /> },
  );
  return { user, onStartOver };
}

const code = () => screen.getByRole('textbox', { name: /Code/ });
const create = () => screen.getByRole('button', { name: 'Create my company' });
const ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

describe('SignupCodeForm', () => {
  beforeEach(() => {
    complete.mockReset();
  });
  afterEach(clearSession);

  it('says where the code went and asks for it', async () => {
    const { user } = mount();
    expect(screen.getByText('We sent a six-digit code to ada@newco.example.')).toBeInTheDocument();
    await user.click(create());
    expect(await screen.findByText('Enter the code from the email')).toBeInTheDocument();
    expect(complete).not.toHaveBeenCalled();
  });

  it('refuses a code that is not six digits', async () => {
    const { user } = mount();
    await user.type(code(), '12ab');
    await user.click(create());
    expect(await screen.findByText('The code is six digits')).toBeInTheDocument();
    expect(complete).not.toHaveBeenCalled();
  });

  it('creates the company in the browser’s zone, signs the administrator in and opens the portal', async () => {
    const token = makeSessionToken();
    complete.mockResolvedValue({
      data: { completeSignup: { token, user: makeUser({ roles: ['ADMIN'] }) } },
    });
    const { user } = mount();
    await user.type(code(), ' 123456 ');
    await user.click(create());

    expect(await screen.findByText('portal home')).toBeInTheDocument();
    expect(tokenStore.get()).toBe(token);
    expect(complete).toHaveBeenCalledWith({
      variables: { input: { ...DETAILS, timezone: ZONE, code: '123456' } },
    });
  });

  it('sends no country when none was picked', async () => {
    complete.mockResolvedValue({ data: { completeSignup: { token: '', user: null } } });
    const { user } = mount({ ...DETAILS, country: '' });
    await user.type(code(), '123456');
    await user.click(create());

    await vi.waitFor(() =>
      expect(complete).toHaveBeenCalledWith({
        variables: { input: { ...DETAILS, country: null, timezone: ZONE, code: '123456' } },
      }),
    );
    expect(screen.queryByText('portal home')).toBeNull();
    expect(tokenStore.get()).toBeNull();
  });

  it('says why the code was refused', async () => {
    complete.mockImplementation(async () => {
      throw new Error('That code has expired. Ask for a new one.');
    });
    const { user } = mount();
    await user.type(code(), '123456');
    await user.click(create());
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'That code has expired. Ask for a new one.',
    );
  });

  it('falls back to a general message for a failure with no message', async () => {
    complete.mockImplementation(async () => {
      throw 'nope';
    });
    const { user } = mount();
    await user.type(code(), '123456');
    await user.click(create());
    expect(await screen.findByRole('alert')).toHaveTextContent('The company could not be created');
  });

  it('goes back to fix the email', async () => {
    const { user, onStartOver } = mount();
    await user.click(screen.getByRole('button', { name: 'Use a different email' }));
    expect(onStartOver).toHaveBeenCalledTimes(1);
  });
});
