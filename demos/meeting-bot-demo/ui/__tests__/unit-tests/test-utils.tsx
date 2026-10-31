import type { ReactElement, ReactNode } from 'react';
import { render, renderHook, type RenderResult } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '@exyconn/i18n';
import { ColorModeProvider } from '@exyconn/shell/theme/ColorModeContext';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { ConfirmProvider } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { MaBotStatus } from '@exyconn/shell/graphql/generated';
import type { DemoTrip } from '../../src/pages/meeting-bot/useMeetingBotDemo';

/** What the shell's PortalApp puts above the demo page: Apollo, i18n, theme, toasts, confirms. */
function Providers({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <MockedProvider mocks={[]} showWarnings={false}>
      <I18nProvider locale="en" messages={{}}>
        <ColorModeProvider>
          <NotificationProvider>
            <ConfirmProvider>
              <MemoryRouter>{children}</MemoryRouter>
            </ConfirmProvider>
          </NotificationProvider>
        </ColorModeProvider>
      </I18nProvider>
    </MockedProvider>
  );
}

export function renderWithProviders(ui: ReactElement): RenderResult {
  return render(ui, { wrapper: Providers });
}

export function renderHookWithProviders<Result>(hook: () => Result) {
  return renderHook(hook, { wrapper: Providers });
}

/** A trip as the server sends it; queued and without notes unless overridden. */
export function tripOf(overrides: Partial<DemoTrip> = {}): DemoTrip {
  return {
    __typename: 'MeetingBotDemoTrip',
    id: 'trip-1',
    meetingCode: 'abc-defg-hij',
    meetUrl: 'https://meet.google.com/abc-defg-hij',
    status: MaBotStatus.Queued,
    error: '',
    createdAt: '2026-10-31T10:00:00.000Z',
    finishedAt: null,
    summaryStatus: 'NOT_STARTED',
    emailedAt: null,
    purgeAfter: '2026-11-07T10:00:00.000Z',
    purged: false,
    summary: null,
    ...overrides,
  };
}

/** Notes as the server sends them. */
export const SUMMARY: NonNullable<DemoTrip['summary']> = {
  __typename: 'MeetingBotDemoSummary',
  title: 'Demo call · Acme',
  executiveSummary: 'We agreed the rollout.',
  discussionPoints: ['Pricing'],
  decisions: ['Go with plan B'],
  actionItems: [
    {
      __typename: 'MeetingBotDemoAction',
      id: 'a1',
      title: 'Send quote',
      assignedTo: 'Asha',
      dueDate: null,
      dueText: 'Friday',
    },
    {
      __typename: 'MeetingBotDemoAction',
      id: 'a2',
      title: 'Book demo',
      assignedTo: null,
      dueDate: '2026-11-06T00:00:00.000Z',
      dueText: null,
    },
    {
      __typename: 'MeetingBotDemoAction',
      id: 'a3',
      title: 'Think it over',
      assignedTo: null,
      dueDate: null,
      dueText: null,
    },
  ],
};

/** The demo's terms as the server sends them. */
export const INFO = {
  __typename: 'MeetingBotDemoInfo' as const,
  enabled: true,
  botName: 'Exyconn Notetaker',
  tripsPerDay: 3,
  tripsLeftToday: 2,
  retentionDays: 7,
  maxMeetingMinutes: 30,
  consentText: 'I invite Exyconn Notetaker into this call.',
};
