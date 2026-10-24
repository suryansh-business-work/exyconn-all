import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CrmTimelineKind, CrmTimelineObject } from '@exyconn/shell/graphql/generated';
import { activityTabs } from '../../../../src/records/detail';
import type { TimelineRow } from '../../../../src/records/detail/timeline/TimelineEntry';
import { renderWithProviders } from '../../test-utils';

const gql = vi.hoisted(() => ({ timeline: vi.fn() }));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCrmTimelineQuery: (options: unknown) => gql.timeline(options),
}));

/** The forms are tested on their own; here only which one opens matters. */
vi.mock('../../../../src/records/detail/forms/log-activity', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  LogActivityForm: ({ type }: { type: string }) => <p>{`log ${type}`}</p>,
}));
vi.mock('../../../../src/records/detail/forms/add-reminder', () => ({
  AddReminderForm: () => <p>reminder form</p>,
}));

const row = (id: string, kind: CrmTimelineKind, remindAt: string | null = null): TimelineRow => ({
  __typename: 'CrmTimelineItem',
  id,
  kind,
  at: '2026-10-15T10:00:00.000Z',
  title: `Entry ${id}`,
  summary: '',
  actor: '',
  status: '',
  url: '',
  opensPage: false,
  remindAt,
  attachments: [],
});

const TARGET = { relatedType: 'CONTACT' as const, relatedId: 'c1', relatedName: 'Asha' };
const tabs = activityTabs(CrmTimelineObject.Contact, TARGET);
const renderTab = (slug: string) =>
  renderWithProviders(<>{tabs.find((tab) => tab.slug === slug)?.content}</>);

describe('activityTabs', () => {
  beforeEach(() => {
    gql.timeline.mockReturnValue({
      data: {
        crmTimeline: [
          row('note', CrmTimelineKind.Note),
          row('call', CrmTimelineKind.Call),
          row('task', CrmTimelineKind.Task),
          row('reminder', CrmTimelineKind.Task, '2026-10-30T09:00:00.000Z'),
          row('meeting', CrmTimelineKind.Meeting),
        ],
      },
      loading: false,
    });
  });

  it('offers Notes, Calls, Tasks, Meetings and Reminders', () => {
    expect(tabs.map((tab) => tab.label)).toEqual([
      'Notes',
      'Calls',
      'Tasks',
      'Meetings',
      'Reminders',
    ]);
  });

  it.each([
    ['notes', 'Entry note'],
    ['calls', 'Entry call'],
    ['tasks', 'Entry task'],
    ['meetings', 'Entry meeting'],
    ['reminders', 'Entry reminder'],
  ])('lists only its own kind on %s', (slug, title) => {
    renderTab(slug);

    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getAllByText(/^Entry /)).toHaveLength(1);
  });

  it('logs another of its kind, or sets a reminder', async () => {
    renderTab('calls');
    await userEvent.click(screen.getByRole('button', { name: 'Log call' }));
    expect(await screen.findByText('log CALL')).toBeInTheDocument();
  });

  it('opens the reminder form from Reminders, and says so when there are none', async () => {
    gql.timeline.mockReturnValue({ data: { crmTimeline: [] }, loading: false });
    renderTab('reminders');
    expect(screen.getByText('No reminders set.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Add reminder' }));
    expect(await screen.findByText('reminder form')).toBeInTheDocument();
  });
});
