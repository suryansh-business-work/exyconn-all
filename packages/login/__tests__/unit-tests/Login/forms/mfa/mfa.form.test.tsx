import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { tokenStore } from '@exyconn/shell/auth/tokenStore';
import { clearSession, makeSessionToken, makeUser, renderWithProviders } from '../../../test-utils';

const verify = vi.hoisted(() => vi.fn());
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useVerifyMfaMutation: () => [verify],
}));

const { MfaChallengeForm } = await import('../../../../../src/Login/forms/mfa');

const CHALLENGE = 'challenge-1';
const codeInput = () => screen.getByPlaceholderText('123 456');

function renderMfa(onStartOver = vi.fn(), route = '/login?next=/dashboard') {
  const user = userEvent.setup();
  renderWithProviders(
    <MfaChallengeForm challenge={CHALLENGE} accentColor="#1a237e" onStartOver={onStartOver} />,
    { route, routes: <Route path="/dashboard" element={<p>dashboard</p>} /> },
  );
  return user;
}

async function enter(user: ReturnType<typeof userEvent.setup>, code: string) {
  await user.type(codeInput(), code);
  await user.click(screen.getByRole('button', { name: 'Verify' }));
}

describe('MfaChallengeForm', () => {
  beforeEach(() => {
    verify.mockReset();
  });
  afterEach(clearSession);

  it('rejects a code shorter than six characters', async () => {
    const user = renderMfa();
    expect(codeInput()).toHaveFocus();
    await enter(user, '12345');
    expect(
      await screen.findByText('Enter the six-digit code from your authenticator app'),
    ).toBeInTheDocument();
    expect(verify).not.toHaveBeenCalled();
  });

  it('rejects a code longer than any issued', async () => {
    const user = renderMfa();
    await enter(user, '1'.repeat(21));
    expect(await screen.findByText('That is longer than any code we issue')).toBeInTheDocument();
    expect(verify).not.toHaveBeenCalled();
  });

  it('verifies the trimmed code against the challenge and signs in', async () => {
    const token = makeSessionToken();
    verify.mockResolvedValue({ data: { verifyMfa: { token, user: makeUser() } } });
    const user = renderMfa();
    await enter(user, ' 123456 ');
    expect(await screen.findByText('dashboard')).toBeInTheDocument();
    expect(verify).toHaveBeenCalledWith({ variables: { challenge: CHALLENGE, code: '123456' } });
    expect(tokenStore.get()).toBe(token);
  });

  it('shows the server message and clears the field when the code is refused', async () => {
    verify.mockImplementation(async () => {
      throw new Error('Code expired');
    });
    const user = renderMfa();
    await enter(user, '654321');
    expect(await screen.findByRole('alert')).toHaveTextContent('Code expired');
    expect(codeInput()).toHaveValue('');
  });

  it('falls back to a generic message for a non-Error failure', async () => {
    verify.mockImplementation(() => Promise.reject('nope'));
    const user = renderMfa();
    await enter(user, '654321');
    expect(await screen.findByRole('alert')).toHaveTextContent('That code was not accepted');
  });

  it('stays on the step when the answer has no session, clearing an old error', async () => {
    verify.mockImplementationOnce(() => Promise.reject('nope'));
    const user = renderMfa();
    await enter(user, '654321');
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    verify.mockResolvedValueOnce({ data: { verifyMfa: { token: '', user: makeUser() } } });
    await enter(user, '111111');
    await vi.waitFor(() => expect(verify).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
    expect(tokenStore.get()).toBeNull();
    verify.mockResolvedValueOnce({ data: undefined });
    await user.click(screen.getByRole('button', { name: 'Verify' }));
    await vi.waitFor(() => expect(verify).toHaveBeenCalledTimes(3));
    expect(screen.queryByText('dashboard')).toBeNull();
  });

  it('goes back to the password step on request', async () => {
    const onStartOver = vi.fn();
    const user = renderMfa(onStartOver);
    await user.click(screen.getByRole('button', { name: 'Start again' }));
    expect(onStartOver).toHaveBeenCalledTimes(1);
  });
});
