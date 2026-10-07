import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClientCodeStep } from '../../../../../src/auth/forms/client-sign-in';
import { renderWithProviders } from '../../../test-utils';

const gql = vi.hoisted(() => ({ useVerifyClientHubCodeMutation: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ...gql,
}));

const EMAIL = 'ada@acme.com';
const verify = vi.fn();
const onSignedIn = vi.fn();
const onStartOver = vi.fn();

function renderStep() {
  renderWithProviders(
    <ClientCodeStep
      email={EMAIL}
      accentColor="#1d4ed8"
      onSignedIn={onSignedIn}
      onStartOver={onStartOver}
    />,
  );
  return userEvent.setup();
}

const codeField = () => screen.getByLabelText('Code from the email');
const signInButton = () => screen.getByRole('button', { name: 'Sign in' });

describe('ClientCodeStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.useVerifyClientHubCodeMutation.mockReturnValue([verify, {}]);
  });

  it('says where the code went and how long it lasts, with a numeric six-character field', () => {
    renderStep();
    expect(
      screen.getByText(`We emailed a six-digit code to ${EMAIL}. It works for 10 minutes.`),
    ).toBeInTheDocument();
    expect(codeField()).toHaveAttribute('inputmode', 'numeric');
    expect(codeField()).toHaveAttribute('maxlength', '6');
    expect(codeField()).toHaveAttribute('autocomplete', 'one-time-code');
  });

  it('rejects a code that is not six digits without asking the server', async () => {
    const user = renderStep();
    await user.type(codeField(), '12345');
    await user.click(signInButton());
    expect(await screen.findByText('Enter the six-digit code from the email')).toBeInTheDocument();
    expect(verify).not.toHaveBeenCalled();
  });

  it('checks the code for this email and hands back the pass', async () => {
    const pass = `pass-${Date.now()}`;
    verify.mockResolvedValue({
      data: { verifyClientHubCode: { token: pass, name: 'Ada Lovelace', email: EMAIL } },
    });
    const user = renderStep();
    await user.type(codeField(), '123456');
    await user.click(signInButton());
    await waitFor(() => expect(onSignedIn).toHaveBeenCalledWith(pass));
    expect(verify).toHaveBeenCalledWith({ variables: { email: EMAIL, code: '123456' } });
  });

  it('does not sign in when the server answers without a pass', async () => {
    verify.mockResolvedValue({ data: undefined });
    const user = renderStep();
    await user.type(codeField(), '654321');
    await user.click(signInButton());
    await waitFor(() => expect(verify).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(signInButton()).toBeEnabled());
    expect(onSignedIn).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it("shows the server's reason for a refused code", async () => {
    verify.mockRejectedValue(new Error('That code has expired'));
    const user = renderStep();
    await user.type(codeField(), '123456');
    await user.click(signInButton());
    expect(await screen.findByRole('alert')).toHaveTextContent('That code has expired');
    expect(onSignedIn).not.toHaveBeenCalled();
  });

  it('falls back to a plain message when the failure carries none', async () => {
    verify.mockRejectedValue({ code: 503 });
    const user = renderStep();
    await user.type(codeField(), '123456');
    await user.click(signInButton());
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The code could not be checked. Try again.',
    );
  });

  it('lets the contact start over with a different email', async () => {
    const user = renderStep();
    await user.click(
      screen.getByRole('button', { name: 'Use a different email or send a new code' }),
    );
    expect(onStartOver).toHaveBeenCalledTimes(1);
  });
});
