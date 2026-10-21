import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  FilterOp,
  MaMeetingsPagedDocument,
  MaScope,
  useMaDeleteMeetingMutation,
} from '@exyconn/shell/graphql/generated';
import { MeetingsListPage } from '../../../src/meetings/MeetingsListPage';
import { MEETING_COLUMNS } from '../../../src/meetings/meetings-grid';
import { makeMeeting } from '../fixtures';
import { gridProps } from '../grid-stubs';
import { readsPageFrom } from '../fetcher-spy';
import { mutationTuple, renderWithProviders } from '../test-utils';

vi.mock('../../../src/lib/useScopedFetcher', async (orig) =>
  (await import('../fetcher-spy')).spyOnFetcher(orig),
);

vi.mock('@exyconn/crud', async (orig) => ({
  ...(await orig<typeof import('@exyconn/crud')>()),
  CrudDashboard: (await import('../grid-stubs')).GridStub,
}));

vi.mock('@exyconn/shell/graphql/generated', async (orig) => ({
  ...(await orig<typeof import('@exyconn/shell/graphql/generated')>()),
  useMaDeleteMeetingMutation: vi.fn(),
}));

const deleteMeeting = vi.fn();
const location = () => screen.getByRole('status', { name: 'location', hidden: true });

beforeEach(() => {
  deleteMeeting.mockReset().mockResolvedValue({ data: { maDeleteMeeting: true } });
  vi.mocked(useMaDeleteMeetingMutation).mockReturnValue(mutationTuple(deleteMeeting) as never);
});

describe('MeetingsListPage', () => {
  it("lists the company's meetings through the server-paged grid", () => {
    renderWithProviders(<MeetingsListPage scope="ALL" basePath="/ai/ma" />);
    const grid = gridProps();
    expect(grid.title).toBe('Meetings');
    expect(grid.columnDefs).toBe(MEETING_COLUMNS);
    expect(grid.exportFileName).toBe('meetings');
    expect(grid.fetchRows.list).toBe('maMeetingsPaged');
    expect(grid.fetchRows.variablesFor?.({ page: 0, pageSize: 25 })).toEqual({
      scope: MaScope.All,
      input: { page: 0, pageSize: 25, filters: [] },
    });
    expect(grid.context.formatDateTime?.('2026-10-20T09:00:00.000Z')).toMatch(/2026/);
    expect(MaMeetingsPagedDocument).toBeDefined();
    expect(readsPageFrom('maMeetingsPaged')).toBe(true);
  });

  it('pins AI Notes to meetings whose summary is ready', () => {
    renderWithProviders(<MeetingsListPage scope="MINE" basePath="/me/meetings" notesOnly />);
    const grid = gridProps();
    expect(grid.title).toBe('AI Notes');
    expect(grid.exportFileName).toBe('meeting-notes');
    expect(grid.fetchRows.variablesFor?.({ page: 0, pageSize: 25 })).toEqual({
      scope: MaScope.Mine,
      input: {
        page: 0,
        pageSize: 25,
        filters: [{ field: 'summaryStatus', op: FilterOp.Equals, value: 'READY' }],
      },
    });
  });

  it('opens a meeting from its row or its open button', () => {
    renderWithProviders(<MeetingsListPage scope="ALL" basePath="/ai/ma" />);
    act(() => gridProps().onRowClick?.(makeMeeting()));
    expect(location()).toHaveTextContent('/ai/ma/meetings/meeting-1');
    act(() => {
      gridProps().context.actions.open(makeMeeting({ id: 'meeting-2' }));
    });
    expect(location()).toHaveTextContent('/ai/ma/meetings/meeting-2');
  });

  it('deletes a meeting only after a destructive confirmation', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MeetingsListPage scope="ALL" basePath="/ai/ma" />);
    act(() => {
      gridProps().context.actions.delete(makeMeeting());
    });
    expect(
      await screen.findByText(
        'Delete "Weekly sync" with its transcript, notes, actions and emails? This cannot be undone.',
      ),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(deleteMeeting).toHaveBeenCalledWith({ variables: { id: 'meeting-1' } });
    expect(await screen.findByText('Meeting deleted')).toBeInTheDocument();
  });
});
