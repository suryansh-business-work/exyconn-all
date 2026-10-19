import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { appBaseUrl } from '@exyconn/shell/config/apps';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { BookingPageLink } from '../../../../src/pages/meetings/BookingPageLink';
import { renderWithProviders } from '../../test-utils';
import { installClipboard, restoreClipboard } from './clipboard';

const gql = vi.hoisted(() => ({ path: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useMeetingBookingPagePathQuery: () => gql.path(),
}));

describe('BookingPageLink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.path.mockReturnValue({ data: { meetingBookingPagePath: '/book/team' } });
  });
  afterEach(restoreClipboard);

  it('shows nothing until the booking page has an address', () => {
    gql.path.mockReturnValue({ data: undefined });
    const { container } = renderWithProviders(<BookingPageLink />);

    expect(container).toBeEmptyDOMElement();
  });

  it('links the full booking page address in a new tab', () => {
    renderWithProviders(<BookingPageLink />);
    const url = `${appBaseUrl('crm')}/book/team`;

    const link = screen.getByRole('link', { name: url });
    expect(link).toHaveAttribute('href', url);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('copies the address and says so', async () => {
    const writeText = installClipboard();
    renderWithProviders(<BookingPageLink />);

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));

    expect(writeText).toHaveBeenCalledWith(`${appBaseUrl('crm')}/book/team`);
    expect(await screen.findByText('Booking page link copied')).toBeInTheDocument();
  });

  it('reports and logs a copy the browser refused', async () => {
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    const refused = new Error('denied');
    installClipboard().mockRejectedValueOnce(refused);
    renderWithProviders(<BookingPageLink />);

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));

    expect(await screen.findByText('Could not copy the link')).toBeInTheDocument();
    expect(warn).toHaveBeenCalledWith('crm: copying the booking page link failed', refused);
  });
});
