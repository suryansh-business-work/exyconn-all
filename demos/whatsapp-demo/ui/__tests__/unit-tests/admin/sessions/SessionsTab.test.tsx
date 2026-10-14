import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterOp } from '@exyconn/shell/graphql/generated';
import { SessionsTab } from '../../../../src/admin/sessions';
import {
  SESSION_COLUMNS,
  type SessionGridContext,
  type SessionRow,
} from '../../../../src/admin/sessions/session.columns';
import type { SessionFilterValues } from '../../../../src/admin/sessions/SessionFilters';
import type { SessionQueryScope } from '../../../../src/admin/sessions/useSessionFetcher';
import { renderWithProviders } from '../../test-utils';
import { demoRow, sessionRow } from '../admin.fixtures';

interface GridProps {
  columnDefs: unknown;
  fetchRows: unknown;
  context: SessionGridContext;
  refreshSignal: number;
  onRowClick: (row: SessionRow) => void;
  searchPlaceholder: string;
}

const seen = vi.hoisted(() => ({
  grid: null as unknown,
  scope: null as unknown,
  fetchRows: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useWhatsappDemosQuery: () => ({
    data: { whatsappDemos: [demoRow({ key: 'salon', industry: 'Beauty' })] },
  }),
}));
vi.mock('@exyconn/shell/components/data/ServerDataGrid', () => ({
  ServerDataGrid: (props: Readonly<GridProps>) => {
    seen.grid = props;
    return <p>{`Grid, refresh ${props.refreshSignal}`}</p>;
  },
}));
vi.mock('../../../../src/admin/sessions/useSessionFetcher', () => ({
  useSessionFetcher: (scope: SessionQueryScope) => {
    seen.scope = scope;
    return { fetchRows: seen.fetchRows, refreshSignal: 3 };
  },
}));
vi.mock('../../../../src/admin/sessions/SessionFilters', () => ({
  ANY: '',
  SessionFilters: ({ onChange }: Readonly<{ onChange: (next: SessionFilterValues) => void }>) => (
    <>
      <button type="button" onClick={() => onChange({ industry: 'clinic', status: '' })}>
        Industry only
      </button>
      <button type="button" onClick={() => onChange({ industry: '', status: 'ended' })}>
        Status only
      </button>
      <button type="button" onClick={() => onChange({ industry: 'clinic', status: 'active' })}>
        Both
      </button>
    </>
  ),
}));
vi.mock('../../../../src/admin/sessions/detail', () => ({
  SessionDrawer: ({
    sessionId,
    onClose,
  }: Readonly<{ sessionId: string | null; onClose: () => void }>) =>
    sessionId ? (
      <button type="button" onClick={onClose}>{`Close session ${sessionId}`}</button>
    ) : null,
}));

const grid = () => seen.grid as GridProps;
const scope = () => seen.scope as SessionQueryScope;
const ROUTE = '/admin/sessions?from=2026-09-01&to=2026-09-30';

beforeEach(() => {
  seen.grid = null;
  seen.scope = null;
});

describe('SessionsTab', () => {
  it('pages the session log for the period, newest first, through the shared grid', () => {
    renderWithProviders(<SessionsTab />, { route: ROUTE });
    expect(document.title).toContain('WhatsApp demo sessions');
    expect(screen.getByText('Grid, refresh 3')).toBeInTheDocument();
    expect(scope()).toEqual({
      from: new Date(2026, 8, 1).toISOString(),
      to: new Date(2026, 8, 30, 23, 59, 59, 999).toISOString(),
      filters: [],
    });
    expect(grid().columnDefs).toBe(SESSION_COLUMNS);
    expect(grid().fetchRows).toBe(seen.fetchRows);
    expect(grid().searchPlaceholder).toBe('Search by name or email…');
    expect(grid().context.industryName('salon')).toBe('Beauty');
    expect(grid().context.formatDateTime('')).toBe('');
  });

  it.each([
    ['Industry only', [{ field: 'demos', op: FilterOp.Equals, value: 'clinic' }]],
    ['Status only', [{ field: 'status', op: FilterOp.Equals, value: 'ended' }]],
    [
      'Both',
      [
        { field: 'demos', op: FilterOp.Equals, value: 'clinic' },
        { field: 'status', op: FilterOp.Equals, value: 'active' },
      ],
    ],
  ])('turns the "%s" selects into server filters', async (button, filters) => {
    const user = userEvent.setup();
    renderWithProviders(<SessionsTab />, { route: ROUTE });
    await user.click(screen.getByRole('button', { name: button }));
    expect(scope().filters).toEqual(filters);
  });

  it("opens a row's session in the drawer and closes it again", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SessionsTab />, { route: ROUTE });
    expect(screen.queryByRole('button', { name: /Close session/ })).not.toBeInTheDocument();
    act(() => grid().onRowClick(sessionRow({ sessionId: 'sess-42' })));
    await user.click(screen.getByRole('button', { name: 'Close session sess-42' }));
    expect(screen.queryByRole('button', { name: /Close session/ })).not.toBeInTheDocument();
  });
});
