import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CallingBotCallsPanel } from '../../../../src/pages/bots/CallingBotCallsPanel';
import type { CallRow } from '../../../../src/pages/bots/CallTranscriptDialog';
import { renderWithProviders } from '../../test-utils';
import { table, type StubTableProps } from '../environment-variables/panel.harness';
import { callRow } from './calling-bot.fixtures';

const api = vi.hoisted(() => ({
  data: undefined as unknown,
  loading: false,
  options: null as unknown,
  refetch: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useCallingBotRecentCallsQuery: (options: unknown) => {
    api.options = options;
    return { data: api.data, loading: api.loading, refetch: api.refetch };
  },
}));
vi.mock('@exyconn/shell/components/data/DataTable', async () =>
  (await import('../environment-variables/panel.harness')).dataTableModule(),
);

/** The stand-in table's props, with the row click this panel hands it. */
const tableProps = () => table.props as StubTableProps & { onRowClick: (row: CallRow) => void };

const ROWS = [
  callRow(),
  callRow({
    id: 'call-2',
    callerName: '',
    callerEmail: 'visitor@example.com',
    scenarioTitle: null,
    answeredAt: null,
    endReason: 'Sarvam refused the key',
    transcript: [],
  }),
  callRow({
    id: 'call-3',
    answeredAt: '2026-10-01T10:00:10.000Z',
    endedAt: '2026-10-01T10:00:00.000Z',
  }),
  callRow({ id: 'call-4', endedAt: null }),
];

beforeEach(() => {
  api.data = { callingBotRecentCalls: ROWS };
  api.loading = false;
  api.refetch.mockReset();
});

const cells = (id: string) =>
  within(screen.getByTestId(`row-${id}`))
    .getAllByRole('cell')
    .map((cell) => cell.textContent);

describe('CallingBotCallsPanel', () => {
  it('lists recent calls: who, over what, how long and why each ended', () => {
    renderWithProviders(<CallingBotCallsPanel />);
    expect(screen.getByRole('heading', { name: 'Calls' })).toBeInTheDocument();
    expect(api.options).toEqual({ fetchPolicy: 'cache-and-network' });
    expect(cells('call-1').slice(1, 8)).toEqual([
      'Asha Rao',
      'BROWSER',
      'Clinic booking',
      expect.stringContaining('ENDED'),
      '2:05',
      '2',
      '—',
    ]);
    expect(cells('call-1')[0]).toMatch(/2026/);
    expect(cells('call-2').slice(1, 8)).toEqual([
      'visitor@example.com',
      'BROWSER',
      '—',
      expect.any(String),
      '—',
      '0',
      'Sarvam refused the key',
    ]);
    expect(cells('call-3')[5]).toBe('0:00');
    expect(cells('call-4')[5]).toBe('—');
    expect(tableProps()).toMatchObject({ loading: false, onRefresh: api.refetch });
  });

  it('says there are no calls before any arrive', () => {
    api.data = undefined;
    api.loading = true;
    renderWithProviders(<CallingBotCallsPanel />);
    expect(screen.getByText('No calls yet.')).toBeInTheDocument();
    expect(tableProps().loading).toBe(true);
  });

  it('opens the transcript of a clicked call, and closes it', async () => {
    renderWithProviders(<CallingBotCallsPanel />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    act(() => tableProps().onRowClick(ROWS[0]));
    const dialog = await screen.findByRole('dialog', { name: 'Call transcript' });
    expect(dialog).toHaveTextContent('I need a check-up.');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
