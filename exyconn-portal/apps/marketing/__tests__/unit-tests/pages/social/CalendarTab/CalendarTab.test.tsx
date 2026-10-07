import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { addMonths, startOfMonth } from 'date-fns';
import { DEFAULT_FORMAT_SETTINGS, formatTime } from '@exyconn/i18n';
import { SocialNetwork } from '@exyconn/shell/graphql/generated';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { CalendarTab } from '../../../../../src/pages/social/CalendarTab';
import { queryRange } from '../../../../../src/pages/social/calendar.days';
import { renderWithProviders } from '../../../test-utils';
import { accountRow, postRow, ruleRow } from '../../../fixtures';

const cal = vi.hoisted(() => ({
  calendar: vi.fn(),
  accounts: vi.fn(),
  rules: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSocialCalendarQuery: (options: unknown) => cal.calendar(options),
  useSocialAccountsQuery: () => cal.accounts(),
  useSocialNetworkRulesQuery: () => cal.rules(),
}));
vi.mock('../../../../../src/pages/social/CalendarTab/CalendarPostDialog', async () => ({
  CalendarPostDialog: (await import('./calendar-dialog-stub')).CalendarDialogStub,
}));
vi.mock('@exyconn/shell/logging/portalLogger', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/logging/portalLogger')>()),
  portalLogger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const NOW = new Date('2026-09-15T08:00:00.000Z');
const POST = postRow({ id: 'post-20', scheduledAt: '2026-09-20T10:00:00.000Z' });
const ACCOUNTS = [accountRow(), accountRow({ id: 'li-1', network: SocialNetwork.Linkedin })];

const lastQuery = () => cal.calendar.mock.calls.at(-1)?.[0];
const iso = (range: { from: Date; to: Date }) => ({
  from: range.from.toISOString(),
  to: range.to.toISOString(),
});

describe('CalendarTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    cal.refetch.mockResolvedValue({});
    cal.accounts.mockReturnValue({ data: { socialAccounts: ACCOUNTS }, loading: false });
    cal.rules.mockReturnValue({
      data: { socialNetworkRules: [ruleRow(SocialNetwork.Facebook)] },
      loading: false,
    });
    cal.calendar.mockReturnValue({
      data: { socialCalendar: [POST] },
      loading: false,
      refetch: cal.refetch,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("asks for this month's weeks, a day either side, on every account", () => {
    renderWithProviders(<CalendarTab />);

    expect(lastQuery()).toEqual({
      variables: { ...iso(queryRange(startOfMonth(NOW))), accountIds: null },
      fetchPolicy: 'cache-and-network',
      skip: false,
    });
    for (const weekday of ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']) {
      expect(screen.getByText(weekday)).toBeInTheDocument();
    }
  });

  it('asks only for the accounts chosen in the address', () => {
    renderWithProviders(<CalendarTab />, { route: '/marketing/social/calendar?accounts=li-1' });

    expect(lastQuery().variables.accountIds).toEqual(['li-1']);
  });

  it('waits for the accounts before asking for any post', () => {
    cal.accounts.mockReturnValue({ data: undefined, loading: true });
    renderWithProviders(<CalendarTab />);

    expect(lastQuery().skip).toBe(true);
    expect(screen.getByRole('progressbar', { name: 'Loading calendar' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Loading accounts' })).toBeInTheDocument();
  });

  it('shows a spinner until the first posts arrive, and the error if they fail', () => {
    cal.calendar.mockReturnValue({ data: undefined, loading: true, refetch: cal.refetch });
    const { unmount } = renderWithProviders(<CalendarTab />);
    expect(screen.getByRole('progressbar', { name: 'Loading calendar' })).toBeInTheDocument();
    unmount();

    cal.calendar.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('Calendar unavailable'),
      refetch: cal.refetch,
    });
    renderWithProviders(<CalendarTab />);
    expect(screen.getByText('Calendar unavailable')).toBeInTheDocument();
  });

  it('opens a post on its day for editing', async () => {
    renderWithProviders(<CalendarTab />);
    const time = formatTime(POST.scheduledAt, DEFAULT_FORMAT_SETTINGS);

    await userEvent.click(
      screen.getByRole('button', { name: `Edit post: Facebook ${time} · Scheduled` }),
    );

    expect(screen.getByText('Editing post-20')).toBeInTheDocument();
  });

  it('plans a post on a day for every account, at ten that morning', async () => {
    renderWithProviders(<CalendarTab />);
    expect(screen.getByText('No dialog')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Schedule a post on 20 Sep 2026' }));

    expect(screen.getByText('Planning fb-1+li-1 at 2026-09-20T10:00:00.000Z')).toBeInTheDocument();
  });

  it('plans a post on the accounts chosen, and closes without saving', async () => {
    renderWithProviders(<CalendarTab />, { route: '/marketing/social/calendar?accounts=li-1' });

    await userEvent.click(screen.getByRole('button', { name: 'Schedule a post on 20 Sep 2026' }));
    expect(screen.getByText('Planning li-1 at 2026-09-20T10:00:00.000Z')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Close dialog' }));
    expect(screen.getByText('No dialog')).toBeInTheDocument();
    expect(cal.refetch).not.toHaveBeenCalled();
  });

  it('closes the dialog and reloads the month once a post is saved', async () => {
    renderWithProviders(<CalendarTab />);
    await userEvent.click(screen.getByRole('button', { name: 'Schedule a post on 20 Sep 2026' }));

    await userEvent.click(screen.getByRole('button', { name: 'Save dialog' }));

    expect(screen.getByText('No dialog')).toBeInTheDocument();
    expect(cal.refetch).toHaveBeenCalledTimes(1);
  });

  it('logs a reload that fails after saving', async () => {
    const failure = new Error('offline');
    cal.refetch.mockRejectedValue(failure);
    renderWithProviders(<CalendarTab />);

    await userEvent.click(screen.getByRole('button', { name: 'Save dialog' }));

    await waitFor(() =>
      expect(portalLogger.warn).toHaveBeenCalledWith('Could not reload the calendar', failure),
    );
  });

  it('moves to the next month and asks for its weeks', async () => {
    renderWithProviders(<CalendarTab />);

    await userEvent.click(screen.getByRole('button', { name: 'Next month' }));

    expect(lastQuery().variables).toEqual({
      ...iso(queryRange(addMonths(startOfMonth(NOW), 1))),
      accountIds: null,
    });
    expect(screen.getByRole('heading', { name: 'October 2026' })).toBeInTheDocument();
  });
});
