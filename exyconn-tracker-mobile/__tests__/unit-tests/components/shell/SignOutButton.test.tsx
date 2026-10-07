import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SignOutButton } from '../../../../src/components/shell/SignOutButton';
import { tracker } from '../../../../src/tracker/instance';
import { deferred } from '../../hooks/deferred';
import { renderWithProviders } from '../../test-utils';
import { failingOn } from '../../forms/unexpected';

vi.mock('../../../../src/tracker/instance', () => ({ tracker: { logout: vi.fn() } }));

/** Opens the confirmation and returns its Sign out button. */
function openConfirmation(): HTMLElement {
  fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
  expect(screen.getByText('Sign out?')).toBeInTheDocument();
  // The opener stays on screen; the dialog's own confirm button comes after it.
  const confirm = screen.getAllByRole('button', { name: 'Sign out' }).at(-1);
  if (confirm === undefined) {
    throw new Error('The confirmation has no Sign out button.');
  }
  return confirm;
}

describe('SignOutButton', () => {
  it('asks first, saying what signing out does to a running session and pending work', () => {
    renderWithProviders(<SignOutButton status="tracking" pendingSync={3} />);
    expect(screen.queryByText('Sign out?')).not.toBeInTheDocument();
    openConfirmation();
    expect(screen.getByText(/Tracking is running\. Signing out stops it/)).toBeInTheDocument();
    expect(screen.getByText(/3 items are still waiting to upload/)).toBeInTheDocument();
  });

  it('closes the question on Cancel without signing out', () => {
    renderWithProviders(<SignOutButton status="idle" pendingSync={0} />);
    openConfirmation();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('Sign out?')).not.toBeInTheDocument();
    expect(tracker.logout).not.toHaveBeenCalled();
  });

  it('shows the upload as the wait it is while signing out', async () => {
    const logout = deferred<undefined>();
    vi.mocked(tracker.logout).mockReturnValue(logout.promise);
    renderWithProviders(<SignOutButton status="idle" pendingSync={1} />);
    fireEvent.click(openConfirmation());
    expect(await screen.findByRole('button', { name: 'Syncing your work…' })).toBeInTheDocument();
    expect(tracker.logout).toHaveBeenCalledTimes(1);
    await act(async () => {
      logout.resolve(undefined);
      await logout.promise;
    });
    // Signed out: the root layout leaves this screen, so the dialog has nothing more to do.
    expect(screen.getByText('Sign out?')).toBeInTheDocument();
  });

  it('closes the question and shows the reason when sign-out fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const cause = new Error('The portal is unreachable.');
    vi.mocked(tracker.logout).mockRejectedValue(cause);
    renderWithProviders(<SignOutButton status="paused" pendingSync={0} />);
    fireEvent.click(openConfirmation());
    expect(await screen.findByText('The portal is unreachable.')).toBeInTheDocument();
    expect(screen.queryByText('Sign out?')).not.toBeInTheDocument();
    expect(error).toHaveBeenCalledWith('Sign out failed', cause);
  });

  it('falls back to a plain sentence when the failure has no words of its own', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(tracker.logout).mockRejectedValue('offline');
    renderWithProviders(<SignOutButton status="idle" pendingSync={0} />);
    fireEvent.click(openConfirmation());
    await waitFor(() =>
      expect(screen.getByText('Sign out did not finish. Try again.')).toBeInTheDocument(),
    );
  });

  it('logs a failure it did not expect while handling a failed sign-out', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const failure = new Error('Translations unavailable');
    vi.mocked(tracker.logout).mockRejectedValue(new Error('offline'));
    renderWithProviders(<SignOutButton status="idle" pendingSync={0} />, {
      onMissing: failingOn('Sign out did not finish. Try again.', failure),
    });
    fireEvent.click(openConfirmation());
    await waitFor(() => expect(error).toHaveBeenCalledWith('Sign out failed', failure));
  });
});
