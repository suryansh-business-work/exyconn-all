import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { appUrl } from '@exyconn/shell/config/apps';
import { ChannelTab } from '../../../../src/admin/channel';
import { renderWithProviders } from '../../test-utils';

const titles = vi.hoisted(() => ({ set: vi.fn() }));
vi.mock('@exyconn/shell/components/layout/usePageTitle', () => ({ usePageTitle: titles.set }));

describe('the WhatsApp number tab', () => {
  it('points to the settings in the Tech portal, in a new tab', () => {
    renderWithProviders(<ChannelTab />);
    expect(titles.set).toHaveBeenCalledWith('WhatsApp number');
    expect(
      screen.getByRole('region', { name: 'The WhatsApp number is set up in the Tech portal' }),
    ).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Open WhatsApp bot settings' });
    expect(link).toHaveAttribute('href', appUrl('tech', '/tech/demos/whatsapp-bot'));
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
