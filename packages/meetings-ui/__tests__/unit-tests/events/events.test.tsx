import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { ComponentType } from 'react';
import type { ICellRendererParams } from 'ag-grid-community';
import { MaEventLevel, MaScope } from '@exyconn/shell/graphql/generated';
import {
  EVENT_COLUMNS,
  MEETING_EVENT_COLUMNS,
  type MeetingEvent,
} from '../../../src/events/events-grid';
import { prettyDetails } from '../../../src/events/EventDetailsDialog';
import { LogsPage } from '../../../src/events/LogsPage';
import { MeetingEvents } from '../../../src/events/MeetingEvents';
import { STARTED } from '../fixtures';
import { columnOf } from '../grid-helpers';
import { gridProps } from '../grid-stubs';
import { readsPageFrom } from '../fetcher-spy';
import { renderWithProviders } from '../test-utils';

vi.mock('../../../src/lib/useScopedFetcher', async (orig) =>
  (await import('../fetcher-spy')).spyOnFetcher(orig),
);

vi.mock('@exyconn/shell/components/data/ServerDataGrid', async () => ({
  ServerDataGrid: (await import('../grid-stubs')).GridStub,
}));

const makeEvent = (patch: Partial<MeetingEvent> = {}): MeetingEvent => ({
  id: 'e1',
  meetingId: 'meeting-1',
  meetingTitle: 'Weekly sync',
  actorName: 'Asha Rao',
  type: 'capture.started',
  level: MaEventLevel.Info,
  message: 'Recording started',
  details: '{"chunks":3}',
  createdAt: STARTED,
  ...patch,
});

describe('event columns', () => {
  const MeetingCell = columnOf(EVENT_COLUMNS, 'meetingTitle').cellRenderer as ComponentType<
    ICellRendererParams<MeetingEvent>
  >;
  const context = { meetingHref: (id: string) => `/m/meetings/${id}` };

  it("links an event to its meeting, and names an account event's lack of one", () => {
    const { rerender } = render(
      <MemoryRouter>
        <MeetingCell {...({ data: makeEvent(), context } as ICellRendererParams<MeetingEvent>)} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Weekly sync' })).toHaveAttribute(
      'href',
      '/m/meetings/meeting-1',
    );
    rerender(
      <MemoryRouter>
        <MeetingCell
          {...({
            data: makeEvent({ meetingId: null, meetingTitle: '' }),
            context,
          } as ICellRendererParams<MeetingEvent>)}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('—')).toBeInTheDocument();
    rerender(
      <MeetingCell {...({ data: undefined, context } as ICellRendererParams<MeetingEvent>)} />,
    );
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it("leaves the meeting out of one meeting's log", () => {
    expect(MEETING_EVENT_COLUMNS.some((column) => column.field === 'meetingTitle')).toBe(false);
  });
});

describe('prettyDetails', () => {
  it('indents JSON, passes anything else through, and is empty for no details', () => {
    expect(prettyDetails('{"a":1}')).toBe('{\n  "a": 1\n}');
    expect(prettyDetails('not json')).toBe('not json');
    expect(prettyDetails('  ')).toBe('');
  });
});

describe('LogsPage', () => {
  it("lists the company's log and opens an entry with its details pretty-printed", async () => {
    renderWithProviders(<LogsPage scope="ALL" basePath="/ai/ma" />);
    expect(screen.getByRole('heading', { name: 'Logs', level: 1 })).toBeInTheDocument();
    const grid = gridProps();
    expect(grid.columnDefs).toBe(EVENT_COLUMNS);
    expect(grid.fetchRows.list).toBe('maEventsPaged');
    expect(readsPageFrom('maEventsPaged')).toBe(true);
    expect(grid.fetchRows.variablesFor?.({ page: 0, pageSize: 10 })).toMatchObject({
      scope: MaScope.All,
    });
    const context = grid.context as unknown as { meetingHref: (id: string) => string };
    expect(context.meetingHref('m2')).toBe('/ai/ma/meetings/m2');

    act(() => grid.onRowClick?.(makeEvent({ level: MaEventLevel.Error })));
    expect(await screen.findByText('Recording started')).toBeInTheDocument();
    expect(screen.getByLabelText('Details')).toHaveTextContent('"chunks": 3');
    expect(screen.getByText('ERROR')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await vi.waitFor(() => expect(screen.queryByText('Recording started')).not.toBeInTheDocument());
  });

  it('shows an entry without details or meeting plainly', async () => {
    renderWithProviders(
      <MeetingEvents scope="MINE" meetingId="meeting-1" meetingHref={(id) => id} />,
    );
    const grid = gridProps();
    expect(grid.columnDefs).toBe(MEETING_EVENT_COLUMNS);
    expect(grid.fetchRows.variablesFor?.({ page: 0, pageSize: 10 })).toMatchObject({
      scope: MaScope.Mine,
      meetingId: 'meeting-1',
    });
    act(() => grid.onRowClick?.(makeEvent({ details: '', meetingTitle: '' })));
    expect(await screen.findByText('Recording started')).toBeInTheDocument();
    expect(screen.queryByLabelText('Details')).not.toBeInTheDocument();
  });
});
