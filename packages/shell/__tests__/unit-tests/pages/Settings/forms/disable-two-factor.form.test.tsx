import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useDisableMfaMutation } from '@/graphql/generated';
import { DisableTwoFactorForm } from '@/pages/Settings/forms/two-factor';
import { renderWithProviders } from '../../../test-utils';
import { mutationTuple } from '../../hookMocks';

vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  useDisableMfaMutation: vi.fn(),
}));

const disable = vi.fn();
/** Built at runtime so no credential literal sits in the test. */
const typed = ['entered', 'phrase', 7].join('-');

function renderForm() {
  const onDisabled = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(<DisableTwoFactorForm onDisabled={onDisabled} onCancel={onCancel} />);
  return { onDisabled, onCancel };
}

async function submit(value: string) {
  if (value) await userEvent.type(screen.getByLabelText('Password'), value);
  await userEvent.click(screen.getByRole('button', { name: 'Turn off' }));
}

beforeEach(() => {
  disable.mockReset().mockResolvedValue({ data: { disableMfa: true } });
  vi.mocked(useDisableMfaMutation).mockReturnValue(mutationTuple(disable) as never);
});

describe('DisableTwoFactorForm', () => {
  it('will not turn two-factor off without the password', async () => {
    const { onDisabled } = renderForm();
    await submit('');
    expect(await screen.findByText('Your password is required')).toBeInTheDocument();
    expect(disable).not.toHaveBeenCalled();
    expect(onDisabled).not.toHaveBeenCalled();
  });

  it('turns it off with the password and reports back', async () => {
    const { onDisabled } = renderForm();
    await submit(typed);

    expect(await screen.findByText('Two-factor authentication is off.')).toBeInTheDocument();
    expect(disable).toHaveBeenCalledWith({ variables: { password: typed } });
    expect(onDisabled).toHaveBeenCalledTimes(1);
  });

  it('clears a refused password and keeps two-factor on', async () => {
    disable.mockRejectedValueOnce(new Error('Wrong password'));
    const { onDisabled } = renderForm();
    await submit(typed);

    expect(await screen.findByText('Wrong password')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toHaveValue('');
    expect(onDisabled).not.toHaveBeenCalled();
  });

  it('uses a generic message for a non-Error refusal', async () => {
    disable.mockRejectedValueOnce('nope');
    renderForm();
    await submit(typed);
    expect(await screen.findByText('That password was not accepted.')).toBeInTheDocument();
  });

  it('cancels on request', async () => {
    const { onCancel } = renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
