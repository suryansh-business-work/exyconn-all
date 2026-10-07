import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAcknowledgePolicyMutation } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { mutationResult } from './helpers/apollo';
import { readOnly, signed, unsigned } from './helpers/policies';
import { PolicyReaderDialog } from '../../../../src/pages/employee/PolicyReaderDialog';
import type { Policy } from '../../../../src/pages/employee/PolicyCard';

vi.mock('@exyconn/shell/hooks/useSettings', () => import('./helpers/settings'));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useAcknowledgePolicyMutation: vi.fn(),
}));

function openReader(
  policy: Policy | null,
  acknowledge: (...args: never[]) => unknown = vi.fn(() => Promise.resolve({})),
  loading = false,
) {
  const onClose = vi.fn();
  const onSigned = vi.fn();
  vi.mocked(useAcknowledgePolicyMutation).mockReturnValue(mutationResult(acknowledge, loading));
  renderWithProviders(<PolicyReaderDialog policy={policy} onClose={onClose} onSigned={onSigned} />);
  return { onClose, onSigned, acknowledge, user: userEvent.setup() };
}

const NAME_FIELD = 'Type your full name to sign';

describe('PolicyReaderDialog', () => {
  it('renders nothing while no policy is being read', () => {
    openReader(null);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows the policy text sanitised, with its version and effective date', () => {
    openReader({ ...unsigned, body: '<p>Be kind.</p><script>alert(1)</script>' });
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Code of conduct')).toBeInTheDocument();
    expect(within(dialog).getByText('Version 2 · effective on 2026-01-01')).toBeInTheDocument();

    const text = within(dialog).getByRole('region', { name: 'Policy text' });
    expect(text).toHaveAttribute('tabindex', '0');
    expect(text.querySelector('p')).toHaveTextContent('Be kind.');
    expect(text.querySelector('script')).toBeNull();
  });

  it('signs only once a name is typed, then confirms and hands back', async () => {
    const { acknowledge, onSigned, user } = openReader(unsigned);
    const sign = screen.getByRole('button', { name: 'Sign' });
    expect(sign).toBeDisabled();

    await user.type(screen.getByRole('textbox', { name: NAME_FIELD }), '   ');
    expect(sign).toBeDisabled();
    await user.clear(screen.getByRole('textbox', { name: NAME_FIELD }));
    await user.type(screen.getByRole('textbox', { name: NAME_FIELD }), 'Asha Rao');
    await user.click(sign);

    expect(acknowledge).toHaveBeenCalledWith({
      variables: { policyId: 'p1', signedName: 'Asha Rao' },
    });
    expect(
      await screen.findByText('Signed — a confirmation is on its way to your inbox'),
    ).toBeInTheDocument();
    expect(onSigned).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('textbox', { name: NAME_FIELD })).toHaveValue('');
  });

  it("keeps the dialog open and shows the server's reason when signing fails", async () => {
    const { onSigned, user } = openReader(
      unsigned,
      vi.fn(() => Promise.reject(new Error('Policy was replaced'))),
    );
    await user.type(screen.getByRole('textbox', { name: NAME_FIELD }), 'Asha Rao');
    await user.click(screen.getByRole('button', { name: 'Sign' }));

    expect(await screen.findByText('Policy was replaced')).toBeInTheDocument();
    expect(onSigned).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox', { name: NAME_FIELD })).toHaveValue('Asha Rao');
  });

  it('falls back to a plain message when the failure carries no reason', async () => {
    const { user } = openReader(unsigned, vi.fn().mockRejectedValue('offline'));
    await user.type(screen.getByRole('textbox', { name: NAME_FIELD }), 'Asha Rao');
    await user.click(screen.getByRole('button', { name: 'Sign' }));
    expect(await screen.findByText('Could not record your signature')).toBeInTheDocument();
  });

  it('cannot sign twice while a signature is being recorded', async () => {
    const { user } = openReader(unsigned, vi.fn(), true);
    await user.type(screen.getByRole('textbox', { name: NAME_FIELD }), 'Asha Rao');
    expect(screen.getByRole('button', { name: 'Sign' })).toBeDisabled();
  });

  it('shows when a signed policy was signed, with no way to sign again', () => {
    openReader(signed);
    expect(screen.getByText('You signed version 3 on on 2026-02-10.')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('says which version was signed when the date is missing', () => {
    openReader({ ...signed, acknowledgedAt: null });
    expect(screen.getByText('You signed version 3.')).toBeInTheDocument();
  });

  it('offers neither a notice nor a signature on a read-only policy, and closes on Escape', async () => {
    const { onClose, user } = openReader(readOnly);
    expect(screen.queryByText(/^You signed/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Sign' })).toBeNull();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
