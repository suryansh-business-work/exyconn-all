import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  EmailVerificationStatus,
  type EmailVerificationBadgeFragment,
} from '@exyconn/shell/graphql/generated';
import { EmailVerifyButton } from '../../../src/email-verification';
import { renderWithProviders } from '../test-utils';

const mocked = vi.hoisted(() => ({ verify: vi.fn(), logError: vi.fn() }));

vi.mock('../../../src/email-verification/useVerifyEmail', () => ({
  useVerifyEmail: () => mocked.verify,
}));
vi.mock('@exyconn/shell/logging/portalLogger', () => ({
  portalLogger: { error: (...args: unknown[]) => mocked.logError(...args) },
}));

const RESULT: EmailVerificationBadgeFragment = {
  __typename: 'EmailVerification',
  id: 'ev-1',
  status: EmailVerificationStatus.Invalid,
  reason: 'No mailbox',
  checkedAt: '2026-10-15T10:00:00.000Z',
};

/** The per-tab memory of checked addresses lives for the module, so each test uses its own address. */
function renderButton(email: string) {
  return renderWithProviders(<EmailVerifyButton email={email} />);
}

describe('EmailVerifyButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('checks the normalised address and shows the result beside the button', async () => {
    let answer: (value: EmailVerificationBadgeFragment) => void = () => undefined;
    mocked.verify.mockReturnValue(
      new Promise((resolve) => {
        answer = resolve;
      }),
    );
    renderButton(' A@B.io ');

    await userEvent.click(screen.getByRole('button', { name: 'Verify A@B.io' }));
    expect(mocked.verify).toHaveBeenCalledWith('a@b.io');
    expect(screen.getByRole('progressbar', { name: 'Checking…' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Verify A@B.io' })).toBeDisabled();

    await act(async () => answer(RESULT));
    expect(await screen.findByRole('img', { name: /^Invalid: No mailbox/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Check A@B.io again' })).toBeEnabled();
  });

  it('remembers a result for the same address in this tab', async () => {
    mocked.verify.mockResolvedValue(RESULT);
    const first = renderButton('memo@b.io');
    await userEvent.click(screen.getByRole('button', { name: 'Verify memo@b.io' }));
    await screen.findByRole('img', { name: /^Invalid:/ });
    first.unmount();

    renderButton('Memo@b.io');
    expect(screen.getByRole('img', { name: /^Invalid:/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Check Memo@b.io again' })).toBeInTheDocument();
  });

  it('shows no result when the check could not run', async () => {
    mocked.verify.mockResolvedValue(null);
    renderButton('none@b.io');
    await userEvent.click(screen.getByRole('button', { name: 'Verify none@b.io' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Verify none@b.io' })).toBeEnabled(),
    );
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('logs an unexpected failure and frees the button', async () => {
    const failure = new Error('crashed');
    mocked.verify.mockRejectedValue(failure);
    renderButton('crash@b.io');
    await userEvent.click(screen.getByRole('button', { name: 'Verify crash@b.io' }));
    await waitFor(() =>
      expect(mocked.logError).toHaveBeenCalledWith('Verifying a CRM email failed', failure),
    );
    expect(screen.getByRole('button', { name: 'Verify crash@b.io' })).toBeEnabled();
  });
});
