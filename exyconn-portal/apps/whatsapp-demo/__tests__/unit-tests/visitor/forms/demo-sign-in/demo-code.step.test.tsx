import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CodeStep } from '../../../../../src/visitor/forms/demo-sign-in';
import { renderWithProviders } from '../../../test-utils';

const api = vi.hoisted(() => ({ verify: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useVerifyWhatsappDemoCodeMutation: () => [api.verify],
}));

function renderStep() {
  const onSignedIn = vi.fn();
  const onStartOver = vi.fn();
  renderWithProviders(
    <CodeStep
      email="asha@example.com"
      accentColor="#0a7d5a"
      onSignedIn={onSignedIn}
      onStartOver={onStartOver}
    />,
  );
  return { onSignedIn, onStartOver, user: userEvent.setup() };
}

async function submitCode(user: ReturnType<typeof userEvent.setup>, code: string) {
  await user.type(screen.getByLabelText('Code from the email'), code);
  await user.click(screen.getByRole('button', { name: 'Open the demo' }));
}

beforeEach(() => {
  api.verify.mockReset();
});

describe('CodeStep', () => {
  it('says where the code went and how long it lasts, with the field focused', () => {
    renderStep();
    expect(
      screen.getByText('We emailed a six-digit code to asha@example.com. It works for 10 minutes.'),
    ).toBeInTheDocument();
    const field = screen.getByLabelText('Code from the email');
    expect(field).toHaveFocus();
    expect(field).toHaveAttribute('maxlength', '6');
    expect(field).toHaveAttribute('autocomplete', 'one-time-code');
  });

  it('asks for the six digits before checking anything', async () => {
    const { user } = renderStep();
    await submitCode(user, '12a4');
    expect(await screen.findByText('Enter the six-digit code from the email')).toBeInTheDocument();
    expect(api.verify).not.toHaveBeenCalled();
  });

  it('hands over the pass once the code is accepted', async () => {
    const pass = ['demo', 'pass', String(Date.now())].join('-');
    api.verify.mockResolvedValue({ data: { verifyWhatsappDemoCode: { token: pass } } });
    const { user, onSignedIn } = renderStep();
    await submitCode(user, '123456');
    await vi.waitFor(() => expect(onSignedIn).toHaveBeenCalledWith(pass));
    expect(api.verify).toHaveBeenCalledWith({
      variables: { email: 'asha@example.com', code: '123456' },
    });
  });

  it('stays put when the reply carries no pass', async () => {
    api.verify.mockResolvedValue({ data: null });
    const { user, onSignedIn } = renderStep();
    await submitCode(user, '123456');
    await vi.waitFor(() => expect(api.verify).toHaveBeenCalledTimes(1));
    expect(onSignedIn).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows why the code was refused', async () => {
    api.verify.mockRejectedValue(new Error('That code has expired. Ask for a new one.'));
    const { user, onSignedIn } = renderStep();
    await submitCode(user, '123456');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'That code has expired. Ask for a new one.',
    );
    expect(onSignedIn).not.toHaveBeenCalled();
  });

  it('falls back to a general message for an unexpected failure', async () => {
    api.verify.mockRejectedValue({ reason: 'unknown' });
    const { user } = renderStep();
    await submitCode(user, '123456');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The code could not be checked. Try again.',
    );
  });

  it('clears an old error on the next try', async () => {
    api.verify.mockRejectedValueOnce(new Error('Wrong code')).mockResolvedValueOnce({ data: null });
    const { user } = renderStep();
    await submitCode(user, '111111');
    expect(await screen.findByRole('alert')).toHaveTextContent('Wrong code');
    await user.click(screen.getByRole('button', { name: 'Open the demo' }));
    await vi.waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });

  it('lets the visitor start over', async () => {
    const { user, onStartOver } = renderStep();
    await user.click(
      screen.getByRole('button', { name: 'Use a different email or send a new code' }),
    );
    expect(onStartOver).toHaveBeenCalledTimes(1);
  });
});
