import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { BookedConfirmation } from '../../../../src/pages/book/BookedConfirmation';
import { renderWithProviders } from '../../test-utils';
import { bookedMeeting } from './book-fixtures';

const chosen = '09:00 PM – 09:30 PM, Wednesday, October 21';

describe('BookedConfirmation', () => {
  it('says what was booked, with whom, when and where', () => {
    renderWithProviders(
      <BookedConfirmation booked={bookedMeeting()} chosen={chosen} zone="Asia/Tokyo" />,
    );

    expect(screen.getByRole('heading', { name: 'You are scheduled' })).toBeInTheDocument();
    expect(screen.getByText('Intro call with Priya')).toBeInTheDocument();
    expect(screen.getByText(`${chosen} (Asia/Tokyo)`)).toBeInTheDocument();
    expect(screen.getByText('Where: Room 4')).toBeInTheDocument();
  });

  it('links each video room by its address, keeping the provider as the label', () => {
    renderWithProviders(
      <BookedConfirmation
        booked={bookedMeeting({
          joinLinks: ['Zoom: https://zoom.us/j/42', 'Google Meet: https://meet.google.com/abc'],
        })}
        chosen={chosen}
        zone="UTC"
      />,
    );

    const zoom = screen.getByRole('link', { name: 'https://zoom.us/j/42' });
    expect(zoom).toHaveAttribute('href', 'https://zoom.us/j/42');
    expect(zoom).toHaveAttribute('target', '_blank');
    expect(zoom.parentElement).toHaveTextContent('Zoom: https://zoom.us/j/42');
    expect(screen.getByRole('link', { name: 'https://meet.google.com/abc' }).parentElement).toHaveTextContent(
      'Google Meet: https://meet.google.com/abc',
    );
  });

  it('leaves out the place and rooms a meeting does not have', () => {
    renderWithProviders(
      <BookedConfirmation
        booked={bookedMeeting({ location: '', joinLinks: [] })}
        chosen={chosen}
        zone="UTC"
      />,
    );

    expect(screen.queryByText(/^Where:/)).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('A calendar confirmation is on its way to your inbox.')).toBeVisible();
  });
});
