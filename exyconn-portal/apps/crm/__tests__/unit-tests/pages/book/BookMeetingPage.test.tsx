import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookMeetingPage } from '../../../../src/pages/book';
import { renderWithProviders } from '../../test-utils';
import { bookedMeeting, publicMeeting } from './book-fixtures';

const gql = vi.hoisted(() => ({
  meeting: vi.fn(),
  meetingArgs: vi.fn(),
  track: vi.fn(),
  slotProps: vi.fn(),
  formProps: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  usePublicMeetingQuery: (options: unknown) => {
    gql.meetingArgs(options);
    return gql.meeting();
  },
  useTrackMeetingViewMutation: () => [gql.track],
}));

vi.mock('@exyconn/shell/theme/ColorModeContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/theme/ColorModeContext')>()),
  useColorMode: () => ({ mode: 'light' }),
}));

// The slot picker and the details form have their own tests; these stand-ins drive the steps.
vi.mock('../../../../src/pages/book/SlotStep', () => ({
  SlotStep: (props: { onPick: (slot: string) => void; onZone: (zone: string) => void }) => {
    gql.slotProps(props);
    return (
      <div>
        <button type="button" onClick={() => props.onZone('Asia/Tokyo')}>
          Use Tokyo
        </button>
        <button type="button" onClick={() => props.onPick('2026-10-21T12:00:00.000Z')}>
          Pick noon
        </button>
      </div>
    );
  },
}));
vi.mock('../../../../src/pages/book/forms/book-meeting', () => ({
  BookMeetingForm: (props: { onBooked: (booked: unknown) => void; onBack: () => void }) => {
    gql.formProps(props);
    return (
      <div>
        <button type="button" onClick={() => props.onBooked(bookedMeeting())}>
          Book it
        </button>
        <button type="button" onClick={props.onBack}>
          Go back
        </button>
      </div>
    );
  },
}));

function renderPage() {
  renderWithProviders(<BookMeetingPage />, {
    path: '/book/:page/:slug',
    route: '/book/team/intro-call',
  });
}

async function pickNoonInTokyo() {
  await userEvent.click(screen.getByRole('button', { name: 'Use Tokyo' }));
  await userEvent.click(screen.getByRole('button', { name: 'Pick noon' }));
}

const chosen = '09:00 PM – 09:30 PM, Wednesday, October 21';

describe('BookMeetingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.track.mockResolvedValue({ data: { trackMeetingView: true } });
    gql.meeting.mockReturnValue({ data: { publicMeeting: publicMeeting() }, loading: false });
  });

  it('loads the meeting named in the address and counts the visit once', () => {
    renderPage();

    expect(gql.meetingArgs).toHaveBeenCalledWith({
      variables: { org: expect.any(String), page: 'team', slug: 'intro-call' },
    });
    expect(gql.track).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('heading', { name: 'Intro call' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Acme logo' })).toBeInTheDocument();
  });

  it('shows a skeleton while the meeting loads, without counting a visit', () => {
    gql.meeting.mockReturnValue({ data: undefined, loading: true });
    renderPage();

    expect(screen.getByText('Loading the meeting')).toBeInTheDocument();
    expect(gql.track).not.toHaveBeenCalled();
  });

  it('keeps the meeting on screen while it reloads', () => {
    gql.meeting.mockReturnValue({ data: { publicMeeting: publicMeeting() }, loading: true });
    renderPage();

    expect(screen.getByRole('heading', { name: 'Intro call' })).toBeInTheDocument();
    expect(screen.queryByText('Loading the meeting')).not.toBeInTheDocument();
  });

  it('says a meeting that does not exist was not found', () => {
    gql.meeting.mockReturnValue({ data: { publicMeeting: null }, loading: false });
    renderPage();

    expect(screen.getByText('Meeting not found.')).toBeInTheDocument();
    expect(gql.track).not.toHaveBeenCalled();
  });

  it('says the link no longer works when the meeting cannot be loaded', () => {
    gql.meeting.mockReturnValue({ data: undefined, loading: false, error: new Error('gone') });
    renderPage();

    expect(screen.getByText('This booking link no longer works.')).toBeInTheDocument();
  });

  it('starts on the slot picker with no time chosen or zone shown', () => {
    renderPage();

    expect(screen.getByRole('button', { name: 'Pick noon' })).toBeInTheDocument();
    expect(screen.queryByText('Enter Details')).not.toBeInTheDocument();
    expect(screen.queryByText('Asia/Tokyo')).not.toBeInTheDocument();
  });

  it('asks for details once a time is picked, showing it in the chosen zone', async () => {
    renderPage();

    await pickNoonInTokyo();

    expect(screen.getByRole('heading', { name: 'Enter Details' })).toBeInTheDocument();
    expect(screen.getByText(chosen)).toBeInTheDocument();
    expect(screen.getByText('Asia/Tokyo')).toBeInTheDocument();
    expect(gql.formProps).toHaveBeenLastCalledWith(
      expect.objectContaining({
        slug: 'intro-call',
        startAt: '2026-10-21T12:00:00.000Z',
        zone: 'Asia/Tokyo',
      }),
    );
  });

  it('goes back to the slot picker from the details step', async () => {
    renderPage();
    await pickNoonInTokyo();

    await userEvent.click(screen.getByRole('button', { name: 'Go back' }));

    expect(screen.getByRole('button', { name: 'Pick noon' })).toBeInTheDocument();
    expect(screen.queryByText(chosen)).not.toBeInTheDocument();
  });

  it('confirms the booking with the time and zone once booked', async () => {
    renderPage();
    await pickNoonInTokyo();

    await userEvent.click(screen.getByRole('button', { name: 'Book it' }));

    expect(screen.getByRole('heading', { name: 'You are scheduled' })).toBeInTheDocument();
    expect(screen.getByText(`${chosen} (Asia/Tokyo)`)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Enter Details' })).not.toBeInTheDocument();
  });
});
