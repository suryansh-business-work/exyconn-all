import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShareRow } from '../../../../../src/pages/projects/shares';
import { renderWithProviders } from '../../../test-utils';
import { shareFixture } from '../projects-fixtures';

describe('ShareRow', () => {
  it('shows a live link with who made it and lets it be revoked', async () => {
    const onRevoke = vi.fn();
    const share = shareFixture();
    renderWithProviders(<ShareRow share={share} expiry="1 Nov 2026" onRevoke={onRevoke} />);

    expect(screen.getByText('Client review')).toBeInTheDocument();
    expect(screen.getByText('Live').closest('.MuiChip-root')).toHaveClass('MuiChip-colorSuccess');
    expect(screen.getByText('Expires 1 Nov 2026 · created by Asha Rao')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Revoke' }));

    expect(onRevoke).toHaveBeenCalledWith(share);
  });

  it('calls an unnamed link untitled and leaves out a creator who is not known', () => {
    renderWithProviders(
      <ShareRow
        share={shareFixture({ label: '', createdByName: '' })}
        expiry="1 Nov 2026"
        onRevoke={vi.fn()}
      />,
    );

    expect(screen.getByText('Untitled link')).toBeInTheDocument();
    expect(screen.getByText('Expires 1 Nov 2026')).toBeInTheDocument();
  });

  it('marks a revoked link and offers no revoke, even if it had not expired', () => {
    renderWithProviders(
      <ShareRow
        share={shareFixture({ revokedAt: '2026-10-03T00:00:00.000Z', isLive: true })}
        expiry="1 Nov 2026"
        onRevoke={vi.fn()}
      />,
    );

    expect(screen.getByText('Revoked').closest('.MuiChip-root')).toHaveClass(
      'MuiChip-colorDefault',
    );
    expect(screen.queryByRole('button', { name: 'Revoke' })).not.toBeInTheDocument();
  });

  it('marks a link past its date as expired', () => {
    renderWithProviders(
      <ShareRow share={shareFixture({ isLive: false })} expiry="1 Sep 2026" onRevoke={vi.fn()} />,
    );

    expect(screen.getByText('Expired')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Revoke' })).not.toBeInTheDocument();
  });
});
