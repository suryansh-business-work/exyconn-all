import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarEventDialog } from '../../../src/calendar/CalendarEventDialog';
import { renderWithProviders } from '../test-utils';
import { calendarEvent } from './calendar-fixtures';

const BEFORE = new Date('2026-10-15T08:00:00.000Z');
const AFTER = new Date('2026-10-16T08:00:00.000Z');

describe('CalendarEventDialog', () => {
  it('shows when, who, the guests, the text description and the Meet link', async () => {
    const onClose = vi.fn();
    renderWithProviders(
      <CalendarEventDialog event={calendarEvent()} onClose={onClose} now={BEFORE} />,
    );
    const dialog = screen.getByRole('dialog');

    expect(within(dialog).getByText('15 Oct 2026 09:00 AM to 09:45 AM')).toBeInTheDocument();
    expect(within(dialog).getByText('Lead (lead@exyconn.com)')).toBeInTheDocument();
    expect(within(dialog).getByText('xyz-abcd-efg')).toBeInTheDocument();
    expect(within(dialog).getByText(/click Start in the extension/)).toBeInTheDocument();
    const guests = within(within(dialog).getByRole('region', { name: 'Guests' })).getAllByRole(
      'listitem',
    );
    expect(guests.map((guest) => guest.textContent)).toEqual([
      'Lead (organizer)lead@exyconn.comAccepted',
      'guest@example.comDeclined',
      'Phone guestMaybe',
      'Unknown guestNo reply',
    ]);
    expect(within(dialog).getByLabelText('Description')).toHaveTextContent('<b>not bold</b>');
    expect(dialog.querySelector('b')).toBeNull();
    const meet = within(dialog).getByRole('link', { name: 'Open in Google Meet' });
    expect(meet).toHaveAttribute('href', 'https://meet.google.com/xyz-abcd-efg');
    expect(meet).toHaveAttribute('target', '_blank');
    expect(meet).toHaveAttribute('rel', 'noopener noreferrer');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('leaves out the recording hint, guests and description when there are none to show', () => {
    const event = calendarEvent({
      title: '',
      organizerEmail: null,
      description: '',
      attendees: [],
    });
    renderWithProviders(<CalendarEventDialog event={event} onClose={vi.fn()} now={AFTER} />);
    const dialog = screen.getByRole('dialog');

    expect(within(dialog).getByRole('heading', { name: 'Untitled meeting' })).toBeInTheDocument();
    expect(within(dialog).getByText('Lead')).toBeInTheDocument();
    expect(within(dialog).queryByText(/click Start in the extension/)).toBeNull();
    expect(within(dialog).queryByRole('region', { name: 'Guests' })).toBeNull();
    expect(within(dialog).queryByLabelText('Description')).toBeNull();
  });

  it('names the organizer by address alone, or not at all', () => {
    const { rerender } = renderWithProviders(
      <CalendarEventDialog
        event={calendarEvent({ organizerName: null, attendees: [] })}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('lead@exyconn.com')).toBeInTheDocument();
    rerender(
      <CalendarEventDialog
        event={calendarEvent({ organizerName: null, organizerEmail: null, attendees: [] })}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('is closed with no event', () => {
    renderWithProviders(<CalendarEventDialog event={null} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
