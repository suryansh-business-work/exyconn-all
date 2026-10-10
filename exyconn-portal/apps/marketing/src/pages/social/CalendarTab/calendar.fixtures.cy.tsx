/** What the CalendarTab spec mounts with: mocked answers and the labels it looks for. */
import { MockedProvider } from '@apollo/client/testing/react';
import type { MockLink } from '@apollo/client/testing';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { DEFAULT_FORMAT_SETTINGS, formatDate, formatTime } from '@exyconn/i18n';
import { LocalizationProvider, AdapterDateFns } from '@exyconn/shell/components/ui';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { ConfirmProvider } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { theme } from '@exyconn/shell/config/theme';
import {
  ComposeSocialMediaPostDocument,
  SocialAccountsDocument,
  SocialCalendarDocument,
  SocialNetworkRulesDocument,
  type SocialCalendarQueryVariables,
} from '@exyconn/shell/graphql/generated';
import { CalendarTab } from './CalendarTab';
import { dayKeyIn, wallClock } from '../calendar.days';
import { ACCOUNTS, RULES, post } from '../social.fixtures.cy';

export const now = new Date();
/** The workspace's zone (the default settings here) and today's date there. */
export const ZONE = DEFAULT_FORMAT_SETTINGS.timezone;
export const TODAY = dayKeyIn(now, ZONE);
/** A whole hour today, on the workspace's clock. */
export const today = (hour: number) => wallClock(TODAY, hour, ZONE).toISOString();
export const planLabel = (dayKey: string) =>
  `Schedule a post on ${formatDate(wallClock(dayKey, 12, ZONE), DEFAULT_FORMAT_SETTINGS)}`;
/** A post's line as the calendar writes it, in the workspace's own time format. */
export const line = (network: string, iso: string, status: string) =>
  `${network} ${formatTime(iso, DEFAULT_FORMAT_SETTINGS)} · ${status}`;
export const FB_LINE = line('Facebook', today(9), 'Published');
export const X_LINE = line('X', today(23), 'Scheduled');

const FB_POST = post('p1', { publishedAt: today(9), permalink: 'https://facebook.com/p1' });
const X_POST = post('p2', {
  status: 'SCHEDULED',
  publishedAt: null,
  scheduledAt: today(23),
  network: 'X',
  accountId: 'x1',
  origin: 'COMPOSED',
  permalink: '',
});
const NEW_POST = post('p3', {
  status: 'SCHEDULED',
  publishedAt: null,
  scheduledAt: today(23),
  network: 'X',
  accountId: 'x1',
  text: 'Planned',
});

/** Shows the address, so a spec can see what the calendar keeps there. */
function LocationProbe() {
  const location = useLocation();
  return <output aria-label="address">{location.search}</output>;
}

interface Options {
  url?: string;
  delay?: number;
  /** What the calendar answers for every account; the Facebook and X posts otherwise. */
  posts?: unknown[];
}

/** The calendar's answers: every post, or only the X account's when that is all that is chosen. */
function mocks(
  { delay = 0, posts = [FB_POST, X_POST] }: Options,
  state: { composed: boolean },
): MockLink.MockedResponse[] {
  const onlyX = (vars: SocialCalendarQueryVariables) => vars.accountIds?.join() === 'x1';
  return [
    {
      request: { query: SocialAccountsDocument },
      result: { data: { socialAccounts: ACCOUNTS } },
      delay,
      maxUsageCount: 10,
    },
    {
      request: { query: SocialNetworkRulesDocument },
      result: { data: { socialNetworkRules: RULES } },
      maxUsageCount: 10,
    },
    {
      request: { query: SocialCalendarDocument, variables: onlyX },
      result: () => ({
        data: { socialCalendar: state.composed ? [X_POST, NEW_POST] : [X_POST] },
      }),
      maxUsageCount: 10,
    },
    {
      request: { query: SocialCalendarDocument, variables: () => true },
      result: { data: { socialCalendar: posts } },
      delay,
      maxUsageCount: 10,
    },
    {
      request: { query: ComposeSocialMediaPostDocument, variables: () => true },
      result: () => {
        state.composed = true;
        return { data: { composeSocialMediaPost: [NEW_POST] } };
      },
    },
  ];
}

export const mount = (options: Options = {}) => {
  const state = { composed: false };
  cy.mount(
    <MemoryRouter initialEntries={[options.url ?? '/marketing/social/calendar']}>
      <MockedProvider mocks={mocks(options, state)}>
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <NotificationProvider>
              <ConfirmProvider>
                <CalendarTab />
                <LocationProbe />
              </ConfirmProvider>
            </NotificationProvider>
          </LocalizationProvider>
        </ThemeProvider>
      </MockedProvider>
    </MemoryRouter>,
  );
  return state;
};
