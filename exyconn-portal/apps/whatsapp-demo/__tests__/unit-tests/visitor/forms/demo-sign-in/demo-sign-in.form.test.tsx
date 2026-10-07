import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WhatsappDemoVisitorSource } from '@exyconn/shell/graphql/generated';
import { DemoSignInForm } from '../../../../../src/visitor/forms/demo-sign-in';
import { renderWithProviders } from '../../../test-utils';

const api = vi.hoisted(() => ({ requestCode: vi.fn(), verify: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useRequestWhatsappDemoCodeMutation: () => [api.requestCode],
  useVerifyWhatsappDemoCodeMutation: () => [api.verify],
}));

function renderForm() {
  const onSignedIn = vi.fn();
  renderWithProviders(<DemoSignInForm accentColor="#0a7d5a" onSignedIn={onSignedIn} />);
  return { onSignedIn, user: userEvent.setup() };
}

async function fillDetails(user: ReturnType<typeof userEvent.setup>, email = ' Asha@Example.com ') {
  await user.type(screen.getByLabelText('Your name'), 'Asha Nair');
  await user.type(screen.getByLabelText('Work email'), email);
  await user.click(screen.getByRole('button', { name: 'Email me a code' }));
}

beforeEach(() => {
  api.requestCode.mockReset().mockResolvedValue({ data: { requestWhatsappDemoCode: true } });
  api.verify.mockReset();
});

describe('DemoSignInForm', () => {
  it('explains that no password is needed', () => {
    renderForm();
    expect(
      screen.getByText('We email you a one-time code — no password needed'),
    ).toBeInTheDocument();
  });

  it('asks for a name and an email before sending anything', async () => {
    const { user } = renderForm();
    await user.click(screen.getByRole('button', { name: 'Email me a code' }));
    expect(await screen.findByText('Enter your name')).toBeInTheDocument();
    expect(screen.getByText('Work email is required')).toBeInTheDocument();
    expect(api.requestCode).not.toHaveBeenCalled();
  });

  it('rejects an address that is not an email', async () => {
    const { user } = renderForm();
    await fillDetails(user, 'asha@example');
    expect(await screen.findByText('Enter a valid email')).toBeInTheDocument();
    expect(api.requestCode).not.toHaveBeenCalled();
  });

  it('files the visitor as a demo-login lead and moves on to the code', async () => {
    const { user } = renderForm();
    await fillDetails(user);
    expect(
      await screen.findByText(
        'We emailed a six-digit code to asha@example.com. It works for 10 minutes.',
      ),
    ).toBeInTheDocument();
    expect(api.requestCode).toHaveBeenCalledWith({
      variables: {
        input: {
          name: 'Asha Nair',
          email: 'Asha@Example.com',
          source: WhatsappDemoVisitorSource.DemoLogin,
        },
      },
    });
  });

  it('shows why the code could not be sent', async () => {
    api.requestCode.mockRejectedValue(new Error('Too many codes requested. Try again later.'));
    const { user } = renderForm();
    await fillDetails(user);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many codes requested. Try again later.',
    );
    expect(screen.getByLabelText('Your name')).toBeInTheDocument();
  });

  it('falls back to a general message for an unexpected failure', async () => {
    api.requestCode.mockRejectedValue('network down');
    const { user } = renderForm();
    await fillDetails(user);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The code could not be sent. Try again.',
    );
  });

  it('signs the visitor in with the pass once the emailed code is accepted', async () => {
    const pass = ['demo', 'pass', String(Date.now())].join('-');
    api.verify.mockResolvedValue({ data: { verifyWhatsappDemoCode: { token: pass } } });
    const { user, onSignedIn } = renderForm();
    await fillDetails(user);
    await user.type(await screen.findByLabelText('Code from the email'), '123456');
    await user.click(screen.getByRole('button', { name: 'Open the demo' }));
    await vi.waitFor(() => expect(onSignedIn).toHaveBeenCalledWith(pass));
    expect(api.verify).toHaveBeenCalledWith({
      variables: { email: 'asha@example.com', code: '123456' },
    });
  });

  it('goes back to the details to use another address', async () => {
    const { user } = renderForm();
    await fillDetails(user);
    await user.click(
      await screen.findByRole('button', { name: 'Use a different email or send a new code' }),
    );
    expect(await screen.findByRole('button', { name: 'Email me a code' })).toBeInTheDocument();
  });
});
