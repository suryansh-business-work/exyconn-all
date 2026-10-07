import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test-utils';

const requestReset = vi.hoisted(() => vi.fn());
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useRequestPasswordResetMutation: () => [requestReset],
}));

const { ForgotPasswordForm, RESET_REQUESTED_MESSAGE } =
  await import('../../../../../src/Login/forms/forgot-password');

function renderForm() {
  const onCancel = vi.fn();
  const onDone = vi.fn();
  const user = userEvent.setup();
  renderWithProviders(<ForgotPasswordForm onCancel={onCancel} onDone={onDone} />);
  return { user, onCancel, onDone };
}

const send = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: 'Send reset link' }));

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    requestReset.mockReset();
  });

  it('requires an email', async () => {
    const { user } = renderForm();
    expect(screen.getByLabelText('Email')).toHaveFocus();
    await send(user);
    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(requestReset).not.toHaveBeenCalled();
  });

  it('rejects a malformed email', async () => {
    const { user } = renderForm();
    await user.type(screen.getByLabelText('Email'), 'asha@');
    await send(user);
    expect(await screen.findByText('Enter a valid email')).toBeInTheDocument();
    expect(requestReset).not.toHaveBeenCalled();
  });

  it('requests a link for the trimmed address, confirms neutrally and closes', async () => {
    requestReset.mockResolvedValue({ data: { requestPasswordReset: true } });
    const { user, onDone } = renderForm();
    await user.type(screen.getByLabelText('Email'), ' asha@example.com ');
    await send(user);
    expect(await screen.findByText(RESET_REQUESTED_MESSAGE)).toBeInTheDocument();
    expect(requestReset).toHaveBeenCalledWith({ variables: { email: 'asha@example.com' } });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('reports a failure and stays open', async () => {
    requestReset.mockImplementation(async () => {
      throw new Error('Too many requests');
    });
    const { user, onDone } = renderForm();
    await user.type(screen.getByLabelText('Email'), 'asha@example.com');
    await send(user);
    expect(await screen.findByText('Too many requests')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('reports a generic failure for a non-Error rejection', async () => {
    requestReset.mockImplementation(() => Promise.reject('offline'));
    const { user } = renderForm();
    await user.type(screen.getByLabelText('Email'), 'asha@example.com');
    await send(user);
    expect(await screen.findByText('Could not request a reset link')).toBeInTheDocument();
  });

  it('cancels without sending', async () => {
    const { user, onCancel } = renderForm();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(requestReset).not.toHaveBeenCalled();
  });
});
