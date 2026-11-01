import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  EmailCodeSignInForm,
  signInCodeSchema,
  signInEmailSchema,
} from '@/components/form/email-code-sign-in';
import { renderWithProviders } from '../../test-utils';

const requestCode = vi.fn<(email: string) => Promise<void>>();
const verifyCode = vi.fn<(email: string, code: string) => Promise<string | undefined>>();
const onSignedIn = vi.fn<(pass: string) => void>();

const emailField = () => screen.getByLabelText(/^Work email\s*\*?$/);
const codeField = () => screen.getByLabelText(/^Code from the email\s*\*?$/);
const press = (name: string) => userEvent.click(screen.getByRole('button', { name }));

function renderForm() {
  renderWithProviders(
    <EmailCodeSignInForm
      accentColor="#1d4ed8"
      requestCode={requestCode}
      verifyCode={verifyCode}
      onSignedIn={onSignedIn}
    />,
  );
}

/** Gets past step one with `email`, landing on the code step. */
async function reachCodeStep(email = 'Sam@Acme.test') {
  renderForm();
  fireEvent.change(emailField(), { target: { value: email } });
  await press('Email me a code');
  await screen.findByLabelText(/^Code from the email/);
}

describe('email-code sign-in schemas', () => {
  it('trims the email and wants exactly six digits for the code', () => {
    expect(signInEmailSchema.parse({ email: ' sam@acme.test ' })).toEqual({
      email: 'sam@acme.test',
    });
    expect(signInCodeSchema.parse({ code: ' 123456 ' })).toEqual({ code: '123456' });
    expect(signInCodeSchema.safeParse({ code: '12345' }).success).toBe(false);
    expect(signInCodeSchema.safeParse({ code: '12345a' }).success).toBe(false);
  });
});

describe('EmailCodeSignInForm', () => {
  beforeEach(() => {
    requestCode.mockReset().mockResolvedValue(undefined);
    verifyCode.mockReset().mockResolvedValue('vendor-pass');
    onSignedIn.mockReset();
  });

  it('needs an email before sending a code', async () => {
    renderForm();

    await press('Email me a code');

    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(requestCode).not.toHaveBeenCalled();
  });

  it('refuses something that is not an email address', async () => {
    renderForm();
    fireEvent.change(emailField(), { target: { value: 'sam-at-acme' } });

    await press('Email me a code');

    expect(await screen.findByText('Enter a valid email')).toBeInTheDocument();
    expect(requestCode).not.toHaveBeenCalled();
  });

  it('emails a code and asks for it, naming the address in lower case', async () => {
    await reachCodeStep('  Sam@Acme.TEST ');

    expect(requestCode).toHaveBeenCalledWith('Sam@Acme.TEST');
    expect(
      screen.getByText('We emailed a six-digit code to sam@acme.test. It works for 10 minutes.'),
    ).toBeInTheDocument();
    expect(codeField()).toHaveAttribute('maxlength', '6');
    expect(codeField()).toHaveAttribute('inputmode', 'numeric');
  });

  it('shows why the code could not be sent and stays on the email step', async () => {
    requestCode.mockRejectedValueOnce(
      new Error('This email does not have vendor portal access yet.'),
    );
    renderForm();
    fireEvent.change(emailField(), { target: { value: 'sam@acme.test' } });

    await press('Email me a code');

    expect(
      await screen.findByText('This email does not have vendor portal access yet.'),
    ).toBeInTheDocument();
    expect(emailField()).toBeInTheDocument();
  });

  it('falls back to a plain message when sending fails with something other than an Error', async () => {
    requestCode.mockRejectedValueOnce('offline');
    renderForm();
    fireEvent.change(emailField(), { target: { value: 'sam@acme.test' } });

    await press('Email me a code');

    expect(await screen.findByText('The code could not be sent. Try again.')).toBeInTheDocument();
  });

  it('refuses a code that is not six digits', async () => {
    await reachCodeStep();
    fireEvent.change(codeField(), { target: { value: '12a' } });

    await press('Sign in');

    expect(await screen.findByText('Enter the six-digit code from the email')).toBeInTheDocument();
    expect(verifyCode).not.toHaveBeenCalled();
  });

  it('checks the code against the address the code went to and hands the pass on', async () => {
    await reachCodeStep();
    fireEvent.change(codeField(), { target: { value: '123456' } });

    await press('Sign in');

    await waitFor(() => expect(onSignedIn).toHaveBeenCalledWith('vendor-pass'));
    expect(verifyCode).toHaveBeenCalledWith('sam@acme.test', '123456');
  });

  it('does not sign in when no pass comes back', async () => {
    verifyCode.mockResolvedValueOnce(undefined);
    await reachCodeStep();
    fireEvent.change(codeField(), { target: { value: '123456' } });

    await press('Sign in');

    await waitFor(() => expect(verifyCode).toHaveBeenCalled());
    expect(onSignedIn).not.toHaveBeenCalled();
  });

  it('shows why the code was refused', async () => {
    verifyCode.mockRejectedValueOnce(new Error('That code is not right.'));
    await reachCodeStep();
    fireEvent.change(codeField(), { target: { value: '000000' } });

    await press('Sign in');

    expect(await screen.findByText('That code is not right.')).toBeInTheDocument();
    expect(onSignedIn).not.toHaveBeenCalled();
  });

  it('falls back to a plain message when checking fails with something other than an Error', async () => {
    verifyCode.mockRejectedValueOnce('offline');
    await reachCodeStep();
    fireEvent.change(codeField(), { target: { value: '000000' } });

    await press('Sign in');

    expect(
      await screen.findByText('The code could not be checked. Try again.'),
    ).toBeInTheDocument();
  });

  it('goes back to the email step, clearing the code and any error', async () => {
    verifyCode.mockRejectedValueOnce(new Error('That code is not right.'));
    await reachCodeStep();
    fireEvent.change(codeField(), { target: { value: '000000' } });
    await press('Sign in');
    await screen.findByText('That code is not right.');

    await press('Use a different email or send a new code');

    expect(emailField()).toBeInTheDocument();
    expect(screen.queryByText('That code is not right.')).not.toBeInTheDocument();
    fireEvent.change(emailField(), { target: { value: 'kim@acme.test' } });
    await press('Email me a code');
    expect(await screen.findByLabelText(/^Code from the email/)).toHaveValue('');
    expect(requestCode).toHaveBeenLastCalledWith('kim@acme.test');
  });
});
