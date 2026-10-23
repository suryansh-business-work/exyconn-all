import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  EmailVerificationStatus,
  type EmailVerificationBadgeFragment,
} from '@exyconn/shell/graphql/generated';
import { VerifiedEmailList } from '../../../src/email-verification';
import { renderWithProviders } from '../test-utils';

vi.mock('../../../src/email-verification/useVerifyEmail', () => ({
  useVerifyEmail: () => vi.fn(),
}));

const VERIFIED: EmailVerificationBadgeFragment = {
  __typename: 'EmailVerification',
  id: 'ev-1',
  status: EmailVerificationStatus.Verified,
  reason: 'Mailbox exists',
  checkedAt: '2026-10-15T10:00:00.000Z',
  checkedBy: 'Meera',
};

describe('VerifiedEmailList', () => {
  it('shows each address with its own stored check, primary first', () => {
    renderWithProviders(
      <VerifiedEmailList
        emails={[
          { address: 'ops@acme.io', label: 'Work', primary: false },
          { address: 'hello@acme.io', label: 'Main', primary: true, verification: VERIFIED },
        ]}
      />,
    );
    const links = screen.getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(['hello@acme.io', 'ops@acme.io']);

    const primaryRow = links[0].parentElement as HTMLElement;
    expect(
      within(primaryRow).getByRole('img', { name: /^Verified: .+ by Meera$/ }),
    ).toBeInTheDocument();
    expect(
      within(primaryRow).getByRole('button', { name: 'Check hello@acme.io again' }),
    ).toBeInTheDocument();

    const otherRow = links[1].parentElement as HTMLElement;
    expect(within(otherRow).queryByRole('img', { name: /^Verified:/ })).not.toBeInTheDocument();
    expect(
      within(otherRow).getByRole('button', { name: 'Verify ops@acme.io' }),
    ).toBeInTheDocument();
  });

  it('opens the CRM email window for the address clicked, given onCompose', async () => {
    const onCompose = vi.fn();
    renderWithProviders(
      <VerifiedEmailList
        emails={[{ address: 'ops@acme.io', label: 'Work', primary: true }]}
        onCompose={onCompose}
      />,
    );

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'ops@acme.io' }));

    expect(onCompose).toHaveBeenCalledWith('ops@acme.io');
  });
});
