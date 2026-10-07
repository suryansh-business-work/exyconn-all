import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useChangePasswordMutation } from '@/graphql/generated';
import { ChangePasswordForm } from '@/pages/Settings/forms/change-password';
import { renderWithProviders } from '../../../test-utils';
import { mutationTuple } from '../../hookMocks';

vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  useChangePasswordMutation: vi.fn(),
}));

const changePassword = vi.fn();

/** A made-up passphrase of a given length, built at runtime so no credential sits in source. */
const phrase = (seed: string, length = 12) => seed.repeat(length).slice(0, length);

const field = (label: string) => screen.getByLabelText(label);

async function enter(label: string, value: string) {
  if (!value) return;
  await userEvent.click(field(label));
  await userEvent.paste(value);
}

async function fill(current: string, next: string, confirm: string) {
  await enter('Current password', current);
  await enter('New password', next);
  await enter('Confirm new password', confirm);
  await userEvent.click(screen.getByRole('button', { name: 'Update' }));
}

beforeEach(() => {
  changePassword.mockReset().mockResolvedValue({ data: { changePassword: true } });
  vi.mocked(useChangePasswordMutation).mockReturnValue(mutationTuple(changePassword) as never);
});

describe('ChangePasswordForm', () => {
  it('asks for every field before anything is sent', async () => {
    renderWithProviders(<ChangePasswordForm />);
    await fill('', '', '');

    expect(await screen.findByText('Current password is required')).toBeInTheDocument();
    expect(screen.getByText('New password is required')).toBeInTheDocument();
    expect(screen.getByText('Please confirm your password')).toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it('holds the new password to the length policy', async () => {
    renderWithProviders(<ChangePasswordForm />);
    await fill(phrase('a'), phrase('b', 9), phrase('b', 9));
    expect(await screen.findByText('Minimum 10 characters')).toBeInTheDocument();
  });

  it('refuses a new password over 128 characters', async () => {
    renderWithProviders(<ChangePasswordForm />);
    await fill(phrase('a'), phrase('b', 129), phrase('b', 129));
    expect(await screen.findByText('Maximum 128 characters')).toBeInTheDocument();
  });

  it('refuses a new password equal to the current one, and a mismatched confirmation', async () => {
    renderWithProviders(<ChangePasswordForm />);
    await fill(phrase('a'), phrase('a'), phrase('c'));

    expect(
      await screen.findByText('New password must differ from the current one'),
    ).toBeInTheDocument();
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it('changes the password, confirms it and clears the form', async () => {
    renderWithProviders(<ChangePasswordForm />);
    await fill(phrase('a'), phrase('b'), phrase('b'));

    expect(await screen.findByText('Password changed successfully')).toBeInTheDocument();
    expect(changePassword).toHaveBeenCalledWith({
      variables: { currentPassword: phrase('a'), newPassword: phrase('b') },
    });
    expect(field('Current password')).toHaveValue('');
    expect(field('New password')).toHaveValue('');
  });

  it("shows the server's reason when the change is refused", async () => {
    changePassword.mockRejectedValueOnce(new Error('Current password is wrong'));
    renderWithProviders(<ChangePasswordForm />);
    await fill(phrase('a'), phrase('b'), phrase('b'));

    expect(await screen.findByText('Current password is wrong')).toBeInTheDocument();
    expect(field('Current password')).toHaveValue(phrase('a'));
  });

  it('falls back to a generic message for a non-Error failure', async () => {
    changePassword.mockRejectedValueOnce('boom');
    renderWithProviders(<ChangePasswordForm />);
    await fill(phrase('a'), phrase('b'), phrase('b'));
    expect(await screen.findByText('Change failed')).toBeInTheDocument();
  });

  it('clears what was typed on Cancel', async () => {
    renderWithProviders(<ChangePasswordForm />);
    await enter('Current password', phrase('a'));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(field('Current password')).toHaveValue('');
  });
});
