import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClientSignInForm } from '../../../../../src/auth/forms/client-sign-in';
import { renderWithProviders } from '../../../test-utils';

const gql = vi.hoisted(() => ({
  useRequestClientHubCodeMutation: vi.fn(),
  useVerifyClientHubCodeMutation: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ...gql,
}));

const requestCode = vi.fn();
const onSignedIn = vi.fn();

function renderForm() {
  renderWithProviders(<ClientSignInForm accentColor="#1d4ed8" onSignedIn={onSignedIn} />);
  return userEvent.setup();
}

const emailField = () => screen.getByLabelText('Work email');
const sendButton = () => screen.getByRole('button', { name: 'Email me a code' });

describe('ClientSignInForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.useRequestClientHubCodeMutation.mockReturnValue([requestCode, {}]);
    gql.useVerifyClientHubCodeMutation.mockReturnValue([vi.fn(), {}]);
  });

  it('asks for a work email and explains there is no password', () => {
    renderForm();
    expect(emailField()).toHaveAttribute('type', 'email');
    expect(
      screen.getByText('We email you a one-time code — no password needed'),
    ).toBeInTheDocument();
  });

  it('requires an email before sending anything', async () => {
    const user = renderForm();
    await user.click(sendButton());
    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(requestCode).not.toHaveBeenCalled();
  });

  it('rejects something that is not an email', async () => {
    const user = renderForm();
    await user.type(emailField(), 'ada@acme');
    await user.click(sendButton());
    expect(await screen.findByText('Enter a valid email')).toBeInTheDocument();
    expect(requestCode).not.toHaveBeenCalled();
  });

  it('sends the code to the email as typed, then asks for it, addressing the email in lower case', async () => {
    requestCode.mockResolvedValue({ data: { requestClientHubCode: true } });
    const user = renderForm();
    await user.type(emailField(), 'Ada@Acme.com');
    await user.click(sendButton());
    expect(
      await screen.findByText(
        'We emailed a six-digit code to ada@acme.com. It works for 10 minutes.',
      ),
    ).toBeInTheDocument();
    expect(requestCode).toHaveBeenCalledWith({ variables: { email: 'Ada@Acme.com' } });
    expect(screen.getByLabelText('Code from the email')).toBeInTheDocument();
  });

  it('goes back to the email step when the contact starts over', async () => {
    requestCode.mockResolvedValue({ data: { requestClientHubCode: true } });
    const user = renderForm();
    await user.type(emailField(), 'ada@acme.com');
    await user.click(sendButton());
    await user.click(
      await screen.findByRole('button', { name: 'Use a different email or send a new code' }),
    );
    expect(emailField()).toBeInTheDocument();
    expect(sendButton()).toBeInTheDocument();
    expect(screen.queryByLabelText('Code from the email')).not.toBeInTheDocument();
  });

  it("shows the server's reason when the code cannot be sent", async () => {
    requestCode.mockRejectedValue(new Error('This email has no client hub access'));
    const user = renderForm();
    await user.type(emailField(), 'ada@acme.com');
    await user.click(sendButton());
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This email has no client hub access',
    );
    expect(screen.queryByLabelText('Code from the email')).not.toBeInTheDocument();
  });

  it('falls back to a plain message when the failure carries none', async () => {
    requestCode.mockRejectedValue('offline');
    const user = renderForm();
    await user.type(emailField(), 'ada@acme.com');
    await user.click(sendButton());
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The code could not be sent. Try again.',
    );
  });
});
