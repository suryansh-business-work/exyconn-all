import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MaScope,
  useListEmployeeOptionsQuery,
  useMaDashboardQuery,
} from '@exyconn/shell/graphql/generated';
import { MeetingDashboardPage } from '../../../src/dashboard/MeetingDashboardPage';
import { EMPLOYEES } from '../fixtures';
import { queryResult, renderWithProviders } from '../test-utils';

vi.mock('@exyconn/shell/graphql/generated', async (orig) => ({
  ...(await orig<typeof import('@exyconn/shell/graphql/generated')>()),
  useMaDashboardQuery: vi.fn(),
  useListEmployeeOptionsQuery: vi.fn(),
}));

interface ChartProps {
  title: string;
  metrics: { label: string; value: number }[];
  formatValue: (value: number) => string;
}

// Chart.js measures a real canvas, which jsdom does not have; the page's part is the series.
vi.mock('@exyconn/shell/components/dashboard/MetricChart', () => ({
  MetricChart: ({ title, metrics, formatValue }: ChartProps) => (
    <figure aria-label={title}>
      {metrics.map((metric) => `${metric.label}: ${formatValue(metric.value)}`).join(', ')}
    </figure>
  ),
}));

interface PickerProps {
  label: string;
  onChange: (value: Date | null) => void;
}

// MUI X's sectioned date field cannot be typed into under jsdom; the stand-in hands the page a
// picked day, which is all the page does with the picker.
vi.mock('@exyconn/shell/components/ui', async (orig) => ({
  ...(await orig<typeof import('@exyconn/shell/components/ui')>()),
  DatePicker: ({ label, onChange }: PickerProps) => (
    <>
      <button
        type="button"
        onClick={() => onChange(new Date(2026, 9, 1))}
      >{`pick ${label}`}</button>
      <button type="button" onClick={() => onChange(null)}>{`clear ${label}`}</button>
    </>
  ),
}));

const DASHBOARD = {
  maDashboard: {
    totalMeetings: 12,
    meetingsThisMonth: 4,
    totalDurationSeconds: 5400,
    notesGenerated: 10,
    pendingActions: 6,
    completedActions: 9,
    overdueActions: 2,
    transcriptionFailures: 1,
    byDay: [{ value: '2026-10-20', count: 3 }],
  },
};

const location = () => screen.getByRole('status', { name: 'location', hidden: true });

function lastFilter() {
  return vi.mocked(useMaDashboardQuery).mock.lastCall?.[0]?.variables?.filter;
}

beforeEach(() => {
  vi.mocked(useMaDashboardQuery).mockReturnValue(queryResult(DASHBOARD) as never);
  vi.mocked(useListEmployeeOptionsQuery).mockReturnValue(queryResult(EMPLOYEES) as never);
});

describe('MeetingDashboardPage', () => {
  it("shows the company's figures with their explanations and links on", () => {
    renderWithProviders(<MeetingDashboardPage scope="ALL" basePath="/ai/ma" />);
    expect(
      screen.getByRole('heading', { name: 'Meeting Assistant', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText('Total Meetings')).toBeInTheDocument();
    expect(screen.getByText('1h 30m')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'About Overdue Actions' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open meetings' })).toHaveAttribute(
      'href',
      '/ai/ma/meetings',
    );
    expect(screen.getByRole('link', { name: 'Chrome extension' })).toHaveAttribute(
      'href',
      '/ai/ma/extension',
    );
    expect(screen.getByRole('figure', { name: 'Meetings per day' })).toHaveTextContent(/2026: 3$/);
    expect(lastFilter()).toMatchObject({ scope: MaScope.All });
  });

  it('keeps the filters in the URL and asks again with them', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MeetingDashboardPage scope="ALL" basePath="/ai/ma" />, {
      route: '/ai/ma',
    });

    await user.click(screen.getByRole('button', { name: 'pick From' }));
    await user.click(screen.getByRole('button', { name: 'pick To' }));
    await user.click(screen.getByRole('combobox', { name: 'Organizer' }));
    await user.click(await screen.findByRole('option', { name: 'Asha Rao' }));
    await user.click(screen.getByRole('combobox', { name: 'Participant' }));
    await user.click(await screen.findByRole('option', { name: 'Ravi Kumar' }));
    await user.click(screen.getByRole('combobox', { name: 'Status' }));
    await user.click(await screen.findByRole('option', { name: 'Ended' }));
    await user.click(screen.getByRole('combobox', { name: 'Language' }));
    await user.click(await screen.findByRole('option', { name: 'Hinglish' }));

    expect(location()).toHaveTextContent(
      '/ai/ma?from=2026-10-01&to=2026-10-01&organizer=user-1&participant=user-2&status=ENDED&language=HINGLISH',
    );
    expect(lastFilter()).toMatchObject({
      ownerId: 'user-1',
      participantUserId: 'user-2',
      status: 'ENDED',
    });

    await user.click(screen.getByRole('button', { name: 'clear From' }));
    expect(location()).not.toHaveTextContent('from=');
    await user.click(screen.getByRole('combobox', { name: 'Status' }));
    await user.click(await screen.findByRole('option', { name: 'Any' }));
    expect(location()).not.toHaveTextContent('status=');
    await user.clear(screen.getByRole('combobox', { name: 'Organizer' }));
    expect(location()).not.toHaveTextContent('organizer=');

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(location()).toHaveTextContent(/^\/ai\/ma$/);
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
  });

  it("has no organizer filter on one's own meetings", () => {
    vi.mocked(useListEmployeeOptionsQuery).mockReturnValue(queryResult(undefined) as never);
    vi.mocked(useMaDashboardQuery).mockReturnValue(
      queryResult(undefined, { loading: true }) as never,
    );
    renderWithProviders(<MeetingDashboardPage scope="MINE" basePath="/me/meetings" />);
    expect(screen.getByRole('heading', { name: 'My meetings', level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Organizer' })).not.toBeInTheDocument();
    expect(lastFilter()).toMatchObject({ scope: MaScope.Mine });
  });

  it('shows a failed load with Retry', async () => {
    const refetch = vi.fn().mockResolvedValue({});
    vi.mocked(useMaDashboardQuery).mockReturnValue(
      queryResult(undefined, { error: new Error('Dashboard is down'), refetch }) as never,
    );
    renderWithProviders(<MeetingDashboardPage scope="ALL" basePath="/ai/ma" />);
    expect(screen.getByText('Dashboard is down')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalled();
  });
});
