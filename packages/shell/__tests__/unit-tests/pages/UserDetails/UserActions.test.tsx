import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import {
  useResetUserPasswordMutation,
  useSetUserActiveMutation,
  useSetUserBlockedMutation,
} from '@/graphql/generated';
import { UserActions } from '@/pages/UserDetails/UserActions';
import { renderWithProviders } from '../../test-utils';
import { mutationTuple } from '../hookMocks';
import { makeUserDetail } from './userFixture';

vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  useResetUserPasswordMutation: vi.fn(),
  useSetUserActiveMutation: vi.fn(),
  useSetUserBlockedMutation: vi.fn(),
}));

interface FormStubProps {
  onDone: () => void;
  onCancel: () => void;
}

/** The user forms have their own tests; here each only reports done or cancel. */
function formStub(name: string) {
  return function FormStub({ onDone, onCancel }: Readonly<FormStubProps>) {
    return (
      <div>
        <button type="button" onClick={onDone}>{`${name} done`}</button>
        <button type="button" onClick={onCancel}>{`${name} cancel`}</button>
      </div>
    );
  };
}

vi.mock('@/pages/user-forms/user', () => ({ UserForm: formStub('edit') }));
vi.mock('@/pages/user-forms/custom-mail', () => ({ CustomMailForm: formStub('mail') }));
vi.mock('@/pages/user-forms/block-user', () => ({ BlockUserForm: formStub('block') }));

const resetPassword = vi.fn();
const setActive = vi.fn();
const setBlocked = vi.fn();

function renderActions(patch = {}, editPath?: string) {
  const onChanged = vi.fn();
  renderWithProviders(
    <Routes>
      <Route
        path="/"
        element={
          <UserActions user={makeUserDetail(patch)} onChanged={onChanged} editPath={editPath} />
        }
      />
      <Route path="/hr/employees/emp-1/edit" element={<p>edit page</p>} />
    </Routes>,
  );
  return onChanged;
}

const click = async (name: string) => userEvent.click(await screen.findByRole('button', { name }));

beforeEach(() => {
  resetPassword.mockReset().mockResolvedValue({ data: { resetUserPassword: true } });
  setActive.mockReset().mockResolvedValue({ data: {} });
  setBlocked.mockReset().mockResolvedValue({ data: {} });
  vi.mocked(useResetUserPasswordMutation).mockReturnValue(mutationTuple(resetPassword) as never);
  vi.mocked(useSetUserActiveMutation).mockReturnValue(mutationTuple(setActive) as never);
  vi.mocked(useSetUserBlockedMutation).mockReturnValue(mutationTuple(setBlocked) as never);
});

describe('UserActions — confirmed actions', () => {
  it('resets the password once confirmed, then reloads and reports', async () => {
    const onChanged = renderActions();
    await click('Reset & send credentials');
    expect(
      await screen.findByText("Reset Meera Nair's password and email the new credentials?"),
    ).toBeInTheDocument();
    await click('Reset & send');

    expect(await screen.findByText('New credentials emailed')).toBeInTheDocument();
    expect(resetPassword).toHaveBeenCalledWith({ variables: { id: 'emp-1' } });
    expect(onChanged).toHaveBeenCalledTimes(1);
  });

  it('does nothing when the reset is cancelled', async () => {
    const onChanged = renderActions();
    await click('Reset & send credentials');
    await click('Cancel');
    expect(resetPassword).not.toHaveBeenCalled();
    expect(onChanged).not.toHaveBeenCalled();
  });

  it("reports the server's reason when an action fails", async () => {
    resetPassword.mockRejectedValueOnce(new Error('Mail server down'));
    const onChanged = renderActions();
    await click('Reset & send credentials');
    await click('Reset & send');
    expect(await screen.findByText('Mail server down')).toBeInTheDocument();
    expect(onChanged).not.toHaveBeenCalled();
  });

  it('uses a generic message for a non-Error failure', async () => {
    setActive.mockRejectedValueOnce('nope');
    renderActions();
    await click('Deactivate');
    await click('Deactivate');
    expect(await screen.findByText('Action failed')).toBeInTheDocument();
  });

  it('deactivates an active user', async () => {
    renderActions();
    await click('Deactivate');
    expect(await screen.findByText('Deactivate Meera Nair?')).toBeInTheDocument();
    await click('Deactivate');
    expect(await screen.findByText('User deactivated')).toBeInTheDocument();
    expect(setActive).toHaveBeenCalledWith({ variables: { id: 'emp-1', isActive: false } });
  });

  it('activates an inactive user, and does nothing when that is cancelled', async () => {
    renderActions({ isActive: false });
    await click('Activate');
    expect(await screen.findByText('Activate Meera Nair?')).toBeInTheDocument();
    await click('Cancel');
    expect(setActive).not.toHaveBeenCalled();

    await click('Activate');
    await click('Activate');
    expect(await screen.findByText('User activated')).toBeInTheDocument();
    expect(setActive).toHaveBeenCalledWith({ variables: { id: 'emp-1', isActive: true } });
  });

  it('unblocks a blocked user once confirmed', async () => {
    renderActions({ isBlocked: true });
    await click('Unblock');
    await click('Cancel');
    expect(setBlocked).not.toHaveBeenCalled();

    await click('Unblock');
    await click('Unblock');
    expect(await screen.findByText('User unblocked')).toBeInTheDocument();
    expect(setBlocked).toHaveBeenCalledWith({ variables: { id: 'emp-1', isBlocked: false } });
  });
});

describe('UserActions — dialogs', () => {
  it('edits in a dialog, closing and reloading when the form is done', async () => {
    const onChanged = renderActions();
    await click('Edit details');
    expect(screen.getByRole('heading', { name: 'Edit user' })).toBeInTheDocument();
    await click('edit cancel');
    expect(onChanged).not.toHaveBeenCalled();

    await click('Edit details');
    await click('edit done');
    expect(onChanged).toHaveBeenCalledTimes(1);
  });

  it('goes to the edit page when one is given', async () => {
    renderActions({}, '/hr/employees/emp-1/edit');
    await click('Edit details');
    expect(screen.getByText('edit page')).toBeInTheDocument();
  });

  it('writes a custom email in a dialog without reloading the user', async () => {
    const onChanged = renderActions();
    await click('Send custom email');
    expect(screen.getByRole('heading', { name: 'Email Meera Nair' })).toBeInTheDocument();
    await click('mail done');
    expect(onChanged).not.toHaveBeenCalled();
  });

  it('blocks through a dialog and reloads when done', async () => {
    const onChanged = renderActions();
    await click('Temporarily block');
    expect(screen.getByRole('heading', { name: 'Block Meera Nair' })).toBeInTheDocument();
    await click('block done');
    expect(onChanged).toHaveBeenCalledTimes(1);
  });

  it('closes a dialog from its own close button', async () => {
    renderActions();
    await click('Send custom email');
    await click('Close');
    await expect.poll(() => screen.queryByRole('heading', { name: 'Email Meera Nair' })).toBeNull();
  });
});
