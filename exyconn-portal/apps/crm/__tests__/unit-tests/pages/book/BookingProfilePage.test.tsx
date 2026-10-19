import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { BookingProfilePage } from '../../../../src/pages/book';
import { renderWithProviders } from '../../test-utils';
import { bookingPage } from './book-fixtures';

const gql = vi.hoisted(() => ({ page: vi.fn(), pageArgs: vi.fn(), track: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  usePublicBookingPageQuery: (options: unknown) => {
    gql.pageArgs(options);
    return gql.page();
  },
  useTrackMeetingViewMutation: () => [gql.track],
}));

vi.mock('@exyconn/shell/theme/ColorModeContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/theme/ColorModeContext')>()),
  useColorMode: () => ({ mode: 'light' }),
}));

function renderPage() {
  renderWithProviders(<BookingProfilePage />, { path: '/book/:page', route: '/book/team' });
}

describe('BookingProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.track.mockResolvedValue({ data: { trackMeetingView: true } });
    gql.page.mockReturnValue({ data: { publicBookingPage: bookingPage() }, loading: false });
  });

  it('loads the page named in the address and counts one visit to the page itself', () => {
    renderPage();

    expect(gql.pageArgs).toHaveBeenCalledWith({
      variables: { org: expect.any(String), page: 'team' },
    });
    expect(gql.track).toHaveBeenCalledWith({
      variables: expect.objectContaining({ page: 'team', slug: '' }),
    });
    expect(screen.getByRole('heading', { name: 'Acme' })).toBeInTheDocument();
  });

  it('links every meeting with its length, and its description when it has one', () => {
    renderPage();

    const intro = screen.getByRole('link', { name: /Intro call/ });
    expect(intro).toHaveAttribute('href', '/book/team/intro-call');
    expect(within(intro).getByText('30 min')).toBeInTheDocument();
    expect(within(intro).getByText('A first chat about your team.')).toBeInTheDocument();

    const demo = screen.getByRole('link', { name: /Demo/ });
    expect(demo).toHaveAttribute('href', '/book/team/demo');
    expect(demo).toHaveTextContent('Demo45 min');
    expect(screen.queryByText('There is nothing to book right now.')).not.toBeInTheDocument();
  });

  it('says there is nothing to book when no meeting is open', () => {
    gql.page.mockReturnValue({
      data: { publicBookingPage: bookingPage({ meetings: [] }) },
      loading: false,
    });
    renderPage();

    expect(screen.getByText('There is nothing to book right now.')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('shows a skeleton while the page loads, without counting a visit', () => {
    gql.page.mockReturnValue({ data: undefined, loading: true });
    renderPage();

    expect(screen.getByText('Loading the scheduling page')).toBeInTheDocument();
    expect(gql.track).not.toHaveBeenCalled();
  });

  it('keeps the page on screen while it reloads', () => {
    gql.page.mockReturnValue({ data: { publicBookingPage: bookingPage() }, loading: true });
    renderPage();

    expect(screen.getByRole('heading', { name: 'Acme' })).toBeInTheDocument();
  });

  it('says a page that does not exist does not exist', () => {
    gql.page.mockReturnValue({ data: { publicBookingPage: null }, loading: false });
    renderPage();

    expect(screen.getByText('This booking page does not exist.')).toBeInTheDocument();
    expect(gql.track).not.toHaveBeenCalled();
  });
});
