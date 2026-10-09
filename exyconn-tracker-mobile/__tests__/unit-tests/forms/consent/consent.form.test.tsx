import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConsentForm, consentSchema } from '../../../../src/forms/consent';
import { tracker } from '../../../../src/tracker/instance';
import { deferred } from '../../hooks/deferred';
import { renderWithProviders } from '../../test-utils';
import { typeInto } from '../field';
import { failingOn } from '../unexpected';

vi.mock('../../../../src/tracker/instance', () => ({
  tracker: { acceptConsent: vi.fn(), logout: vi.fn() },
}));

function press(name: string | RegExp): void {
  fireEvent.click(screen.getByRole('button', { name }));
}

/** An error that carries no text, so the screen has to fall back to its own words. */
const NO_MESSAGE = '';

describe('ConsentForm', () => {
  it('exports the schema it validates with', () => {
    expect(consentSchema(true).safeParse({ signedName: ' ' }).success).toBe(false);
  });

  it('records a plain agreement when the policy only has to be accepted', async () => {
    vi.mocked(tracker.acceptConsent).mockResolvedValue(undefined);
    renderWithProviders(<ConsentForm mustSign={false} canAgree />);
    expect(document.getElementById('signedName')).toBeNull();
    press('I understand and agree');
    await waitFor(() => expect(tracker.acceptConsent).toHaveBeenCalledWith(''));
  });

  it('asks for a typed signature when the policy must be signed', async () => {
    renderWithProviders(<ConsentForm mustSign canAgree />);
    press('Sign and agree');
    expect(await screen.findByText('Type your full name to sign.')).toBeInTheDocument();
    expect(tracker.acceptConsent).not.toHaveBeenCalled();
  });

  it('records the signature trimmed', async () => {
    vi.mocked(tracker.acceptConsent).mockResolvedValue(undefined);
    renderWithProviders(<ConsentForm mustSign canAgree />);
    expect(
      screen.getByText('Recorded against this version of the policy, and visible to Legal and HR.'),
    ).toBeInTheDocument();
    typeInto('signedName', '  Asha Rao ');
    press('Sign and agree');
    await waitFor(() => expect(tracker.acceptConsent).toHaveBeenCalledWith('Asha Rao'));
  });

  it('cannot agree while nothing has been disclosed', () => {
    renderWithProviders(<ConsentForm mustSign={false} canAgree={false} />);
    press('I understand and agree');
    expect(tracker.acceptConsent).not.toHaveBeenCalled();
  });

  it('shows why the agreement could not be recorded', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const cause = new Error('Policy version changed.');
    vi.mocked(tracker.acceptConsent).mockRejectedValue(cause);
    renderWithProviders(<ConsentForm mustSign={false} canAgree />);
    press('I understand and agree');
    expect(await screen.findByText('Policy version changed.')).toBeInTheDocument();
    expect(error).toHaveBeenCalledWith('Failed to record consent', cause);
  });

  it('falls back to a plain sentence when recording fails without a reason', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(tracker.acceptConsent).mockRejectedValue(null);
    renderWithProviders(<ConsentForm mustSign={false} canAgree />);
    press('I understand and agree');
    expect(await screen.findByText('Could not record your agreement.')).toBeInTheDocument();
  });

  it('signs out on "Not now", locking both buttons meanwhile', async () => {
    const logout = deferred<undefined>();
    vi.mocked(tracker.logout).mockReturnValue(logout.promise);
    renderWithProviders(<ConsentForm mustSign={false} canAgree />);
    press(/^Not now/);
    expect(tracker.logout).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole('progressbar')).toBeInTheDocument();
    press('I understand and agree');
    expect(tracker.acceptConsent).not.toHaveBeenCalled();
    await act(async () => {
      logout.resolve(undefined);
      await logout.promise;
    });
  });

  it('stays on the screen and says why when signing out fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(tracker.logout)
      .mockRejectedValueOnce(new Error(NO_MESSAGE))
      .mockRejectedValueOnce(new Error('Portal unreachable.'));
    renderWithProviders(<ConsentForm mustSign={false} canAgree />);
    press(/^Not now/);
    expect(
      await screen.findByText('Could not sign out. Check your connection and try again.'),
    ).toBeInTheDocument();
    press(/^Not now/);
    expect(await screen.findByText('Portal unreachable.')).toBeInTheDocument();
    expect(error).toHaveBeenCalledWith('Failed to sign out', expect.any(Error));
  });

  it('logs failures it did not expect, when agreeing or declining', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const failure = new Error('Translations unavailable');
    vi.mocked(tracker.acceptConsent).mockRejectedValue(new Error('offline'));
    vi.mocked(tracker.logout).mockRejectedValue(new Error('offline'));
    const { unmount } = renderWithProviders(<ConsentForm mustSign={false} canAgree />, {
      onMissing: failingOn('Could not record your agreement.', failure),
    });
    press('I understand and agree');
    await waitFor(() => expect(error).toHaveBeenCalledWith('Agreeing failed', failure));
    unmount();
    renderWithProviders(<ConsentForm mustSign={false} canAgree />, {
      onMissing: failingOn('Could not sign out. Check your connection and try again.', failure),
    });
    press(/^Not now/);
    await waitFor(() => expect(error).toHaveBeenCalledWith('Declining failed', failure));
  });
});
