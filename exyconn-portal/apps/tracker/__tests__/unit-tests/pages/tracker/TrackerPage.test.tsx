import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { DocumentNode } from 'graphql';
import { skipToken } from '@apollo/client/react';
import {
  TrackerCalendarDocument,
  TrackerDayDocument,
  type TrackerCalendarQuery,
} from '@exyconn/shell/graphql/generated';
import type { TrackerDayCell } from '@exyconn/shell/pages/tracker-view/buildTrackerMonth';
import { TrackerPage } from '../../../../src/pages/tracker/TrackerPage';
import { renderWithProviders, useCurrentUrl } from '../../test-utils';
import { employeeOption, queryResult } from './tracker.fixtures';
import { formatDateTime, formatTime } from './tracker.mocks';

interface ViewProps {
  monthLabel: string;
  onNext: () => void;
  loading: boolean;
  days: TrackerDayCell[];
  buckets: unknown[];
  selectedDate: string | null;
  day: unknown;
  dayLoading: boolean;
  dayLabel: string;
  timezone: string;
  formatTime: unknown;
  formatDateTime: unknown;
  empty?: boolean;
}

const state = vi.hoisted(() => ({
  view: null as null | ViewProps,
  useQuery: vi.fn(),
  users: vi.fn(),
}));

vi.mock('@apollo/client/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: state.useQuery,
}));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListEmployeeOptionsQuery: state.users,
}));
vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('./tracker.mocks')).settingsModuleMock(),
);
vi.mock('@exyconn/shell/pages/tracker-view/TrackerView', () => ({
  TrackerView: (props: Readonly<ViewProps>) => {
    state.view = props;
    return (
      <button type="button" onClick={props.onNext}>
        {props.monthLabel}
      </button>
    );
  },
}));

type Bucket = TrackerCalendarQuery['trackerCalendar'][number];
const bucket: Bucket = {
  date: '2026-01-15',
  activeMs: 3_600_000,
  idleMs: 600_000,
  manualMs: 0,
  keyCount: 120,
  mouseCount: 80,
  sessions: 1,
};
const daySheet = { intervals: [], screenshots: [], sessions: [] };

const view = () => {
  if (!state.view) {
    throw new Error('TrackerView was not rendered');
  }
  return state.view;
};

/** Which query a useQuery call was for, and with what. */
const callsFor = (document: DocumentNode) =>
  state.useQuery.mock.calls.filter(([doc]) => doc === document).map(([, options]) => options);

function Url() {
  return <output>{useCurrentUrl()}</output>;
}

const renderPage = (route: string) =>
  renderWithProviders(
    <>
      <TrackerPage />
      <Url />
    </>,
    { route },
  );

describe('TrackerPage', () => {
  beforeEach(() => {
    state.view = null;
    state.users.mockReturnValue(
      queryResult({
        listEmployeeOptions: [employeeOption('u1', 'Asha Rao'), employeeOption('u2', 'Dev Mehta')],
      }),
    );
    state.useQuery.mockReset().mockImplementation((document: DocumentNode, options: unknown) => {
      if (options === skipToken) {
        return { data: undefined, loading: false };
      }
      if (document === TrackerCalendarDocument) {
        return { data: { trackerCalendar: [bucket] }, loading: true };
      }
      if (document === TrackerDayDocument) {
        return { data: { trackerDay: daySheet }, loading: false };
      }
      return { data: undefined, loading: false };
    });
  });

  it('asks nothing until an employee is picked, and says so', () => {
    renderPage('/tracker?month=2026-01');
    expect(screen.getByRole('heading', { name: 'Time Tracker' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Employee' })).toHaveValue('');
    expect(state.useQuery.mock.calls.every(([, options]) => options === skipToken)).toBe(true);
    expect(view().empty).toBe(true);
    expect(view().buckets).toEqual([]);
    expect(view().day).toBeUndefined();
    expect(view().dayLabel).toBe('');
    expect(view().monthLabel).toBe('January 2026');
  });

  it("reads the employee's month in the workspace timezone and the picked day", () => {
    renderPage('/tracker?employee=u1&month=2026-01&date=2026-01-15');
    expect(screen.getByRole('combobox', { name: 'Employee' })).toHaveValue(
      'Asha Rao (u1@example.test)',
    );
    expect(callsFor(TrackerCalendarDocument).at(-1)).toEqual({
      variables: {
        userId: 'u1',
        from: new Date(2026, 0, 1).toISOString(),
        to: new Date(2026, 1, 1).toISOString(),
        timezone: 'Asia/Kolkata',
      },
    });
    const dayOptions = state.useQuery.mock.calls.at(-1)?.[1];
    expect(dayOptions).toEqual({
      variables: {
        userId: 'u1',
        start: new Date(2026, 0, 15).toISOString(),
        end: new Date(2026, 0, 16).toISOString(),
      },
    });
    expect(view().empty).toBe(false);
    expect(view().loading).toBe(true);
    expect(view().buckets).toEqual([bucket]);
    expect(view().days.find((cell) => cell.dateKey === '2026-01-15')?.bucket).toEqual(bucket);
    expect(view().day).toBe(daySheet);
    expect(view().dayLoading).toBe(false);
    expect(view().selectedDate).toBe('2026-01-15');
    expect(view().dayLabel).toBe('on 2026-01-15');
    expect(view().timezone).toBe('Asia/Kolkata');
    expect(view().formatTime).toBe(formatTime);
    expect(view().formatDateTime).toBe(formatDateTime);
  });

  it('skips the day query while no day is picked', () => {
    renderPage('/tracker?employee=u1&month=2026-01');
    expect(state.useQuery.mock.calls.at(-1)?.[1]).toBe(skipToken);
    expect(view().day).toBeUndefined();
  });

  it('puts the picked employee in the URL, keeping the month, and removes it on clear', async () => {
    renderPage('/tracker?month=2026-01');
    const picker = screen.getByRole('combobox', { name: 'Employee' });
    await userEvent.type(picker, 'Dev');
    await userEvent.click(
      await screen.findByRole('option', { name: 'Dev Mehta (u2@example.test)' }),
    );
    expect(screen.getByRole('status')).toHaveTextContent('/tracker?month=2026-01&employee=u2');

    await userEvent.clear(screen.getByRole('combobox', { name: 'Employee' }));
    expect(screen.getByRole('status')).toHaveTextContent(/^\/tracker\?month=2026-01$/);
  });

  it('offers nobody while the employee list is still loading', () => {
    state.users.mockReturnValue(queryResult(undefined, true));
    renderPage('/tracker?employee=u1&month=2026-01');
    expect(screen.getByRole('combobox', { name: 'Employee' })).toHaveValue('');
  });

  it('moves to the next month from the calendar', async () => {
    renderPage('/tracker?month=2026-01');
    await userEvent.click(screen.getByRole('button', { name: 'January 2026' }));
    expect(screen.getByRole('status')).toHaveTextContent('/tracker?month=2026-02');
  });
});
