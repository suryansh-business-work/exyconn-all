import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MailboxErrorDialog } from '@/components/mailboxes';
import { portalLogger } from '@/logging/portalLogger';
import { renderWithProviders } from '../../test-utils';

vi.mock('@/utils/clipboard', () => ({
  copyToClipboard: vi.fn().mockRejectedValue(new Error('clipboard went away')),
}));

describe('MailboxErrorDialog when copying breaks', () => {
  it('logs the failure instead of throwing at the button', async () => {
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    renderWithProviders(
      <MailboxErrorDialog
        row={{ email: 'hr@acme.io', lastError: 'Gmail /profile failed (500): busy' }}
        onClose={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Copy' }));

    await vi.waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        'mailbox: copying a mailbox error failed',
        expect.any(Error),
      ),
    );
  });
});
