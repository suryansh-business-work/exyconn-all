import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MeetingSummary } from '../../../../src/pages/book/MeetingSummary';
import { renderWithProviders } from '../../test-utils';
import { UrlProbe } from '../../form-stub';
import { publicMeeting } from './book-fixtures';

describe('MeetingSummary', () => {
  it('names the company, the meeting, its length and that details come once booked', () => {
    renderWithProviders(<MeetingSummary meeting={publicMeeting()} backTo="/book/team" />);

    expect(screen.getByText('Acme')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Intro call' })).toBeInTheDocument();
    expect(screen.getByText('30 min')).toBeInTheDocument();
    expect(screen.getByText('Meeting details are shared once you book.')).toBeInTheDocument();
    expect(screen.getByText('A first chat about your team.')).toBeInTheDocument();
  });

  it('shows the picked time and zone once chosen', () => {
    renderWithProviders(
      <MeetingSummary
        meeting={publicMeeting()}
        backTo="/book/team"
        chosen="09:00 PM – 09:30 PM, Wednesday, October 21"
        zone="Asia/Tokyo"
      />,
    );

    expect(screen.getByText('09:00 PM – 09:30 PM, Wednesday, October 21')).toBeInTheDocument();
    expect(screen.getByText('Asia/Tokyo')).toBeInTheDocument();
  });

  it('leaves out the location note and description a meeting does not have', () => {
    renderWithProviders(
      <MeetingSummary
        meeting={publicMeeting({ hasLocation: false, description: '' })}
        backTo="/book/team"
      />,
    );

    expect(screen.queryByText('Meeting details are shared once you book.')).toBeNull();
    expect(screen.queryByText('A first chat about your team.')).toBeNull();
  });

  it('goes back to the company’s booking page', async () => {
    renderWithProviders(
      <>
        <MeetingSummary meeting={publicMeeting()} backTo="/book/team" />
        <UrlProbe />
      </>,
      { route: '/book/team/intro-call' },
    );

    await userEvent.click(screen.getByRole('button', { name: 'All meetings' }));

    expect(screen.getByLabelText('current url')).toHaveTextContent('/book/team');
    expect(screen.getByLabelText('current url')).not.toHaveTextContent('intro-call');
  });
});
