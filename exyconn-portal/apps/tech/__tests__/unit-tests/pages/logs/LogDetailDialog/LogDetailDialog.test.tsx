import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppLogStatus } from '@exyconn/shell/graphql/generated';
import { LogDetailDialog } from '../../../../../src/pages/logs/LogDetailDialog';
import type { LogActions } from '../../../../../src/pages/logs/useLogActions';
import type { AppLogRow } from '../../../../../src/pages/logs/logs-grid';
import { renderWithProviders } from '../../../test-utils';
import { logEvent, logRow } from '../log.fixtures';

const gql = vi.hoisted(() => ({ events: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListAppLogEventsQuery: gql.events,
}));
vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('../log.fixtures')).settingsModule(),
);

const actions = {
  copying: false,
  copyFixPrompt: vi.fn(),
  copyOpenErrors: vi.fn(),
  changeStatus: vi.fn(),
  remove: vi.fn(),
};
const onClose = vi.fn();

const EVENTS = [
  logEvent({ message: 'Latest occurrence' }),
  logEvent({ id: 'evt-2', message: 'Older occurrence', occurredAt: '2026-10-06T09:00:00.000Z' }),
];

const answer = (overrides: object = {}) => ({
  data: { listAppLogEvents: EVENTS },
  loading: false,
  error: undefined,
  ...overrides,
});

const show = (row: AppLogRow | null = logRow(), extra: Partial<LogActions> = {}) =>
  renderWithProviders(
    <LogDetailDialog row={row} actions={{ ...actions, ...extra }} onClose={onClose} />,
  );

const press = (name: string) => userEvent.click(screen.getByRole('button', { name }));

describe('LogDetailDialog', () => {
  beforeEach(() => {
    onClose.mockReset();
    for (const spy of [actions.copyFixPrompt, actions.changeStatus, actions.remove]) {
      spy.mockReset().mockResolvedValue(true);
    }
    gql.events.mockReset().mockReturnValue(answer());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('stays closed, and reads nothing, with no problem picked', () => {
    gql.events.mockReturnValue(answer({ data: undefined }));
    show(null);

    expect(gql.events).toHaveBeenCalledWith({
      variables: { groupId: '' },
      skip: true,
      fetchPolicy: 'network-only',
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('titles the problem by its error name and reads its occurrences fresh', () => {
    show();

    expect(gql.events).toHaveBeenCalledWith({
      variables: { groupId: 'grp-1' },
      skip: false,
      fetchPolicy: 'network-only',
    });
    expect(
      screen.getByRole('heading', { name: 'TypeError: Cannot read properties of undefined' }),
    ).toBeInTheDocument();
    expect(screen.getByText('tracker-mobile')).toBeInTheDocument();
  });

  it('titles a problem with no error name by its message alone', () => {
    show(logRow({ errorName: '' }));

    expect(
      screen.getByRole('heading', { name: 'Cannot read properties of undefined' }),
    ).toBeInTheDocument();
  });

  it('shows a spinner while the occurrences load', () => {
    gql.events.mockReturnValue(answer({ data: undefined, loading: true }));
    show();

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByText('Stack (latest)')).not.toBeInTheDocument();
  });

  it('falls back to the group’s own stack when no occurrence is stored', () => {
    gql.events.mockReturnValue(answer({ data: { listAppLogEvents: [] } }));
    show();

    expect(screen.getByText('Stack (latest)')).toBeInTheDocument();
    expect(screen.queryByText('Recent occurrences')).not.toBeInTheDocument();
  });

  it('shows why the occurrences could not be read', () => {
    gql.events.mockReturnValue(answer({ data: undefined, error: new Error('Query timed out') }));
    show();

    expect(screen.getByText('Query timed out')).toBeInTheDocument();
  });

  it('opens on the latest occurrence and switches to the one picked', async () => {
    show();

    expect(screen.getByText('Recent occurrences')).toBeInTheDocument();
    expect(await screen.findByText('Latest occurrence')).toBeInTheDocument();
    await press('at 2026-10-06T09:00:00.000Z');

    expect(await screen.findByText('Older occurrence')).toBeInTheDocument();
    expect(screen.queryByText('Latest occurrence')).not.toBeInTheDocument();
  });

  it('ignores an open problem and closes once that went through', async () => {
    const row = logRow();
    show(row);
    expect(screen.queryByRole('button', { name: 'Re-open' })).not.toBeInTheDocument();
    await press('Ignore');

    expect(actions.changeStatus).toHaveBeenCalledWith(row, AppLogStatus.Ignored);
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('stays open when marking resolved did not go through', async () => {
    actions.changeStatus.mockResolvedValue(false);
    const row = logRow();
    show(row);
    await press('Mark resolved');

    expect(actions.changeStatus).toHaveBeenCalledWith(row, AppLogStatus.Resolved);
    await Promise.resolve();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('only offers to re-open a problem that is no longer open', async () => {
    const row = logRow({ status: AppLogStatus.Resolved });
    show(row);
    expect(screen.queryByRole('button', { name: 'Ignore' })).not.toBeInTheDocument();
    await press('Re-open');

    expect(actions.changeStatus).toHaveBeenCalledWith(row, AppLogStatus.Open);
  });

  it('deletes the problem and closes, or logs an action that threw', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const row = logRow();
    show(row);
    await press('Delete');
    expect(actions.remove).toHaveBeenCalledWith(row);
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));

    const failure = new Error('network');
    actions.remove.mockRejectedValue(failure);
    await press('Delete');
    await waitFor(() => expect(logged).toHaveBeenCalledWith('Log action failed', failure));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('copies the fix prompt, logging a copy that threw', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const row = logRow();
    show(row);
    await press('Copy fix prompt for Claude');
    expect(actions.copyFixPrompt).toHaveBeenCalledWith(row);

    const failure = new Error('clipboard');
    actions.copyFixPrompt.mockRejectedValue(failure);
    await press('Copy fix prompt for Claude');
    await waitFor(() => expect(logged).toHaveBeenCalledWith(failure));
  });

  it('holds the copy button while a copy is running, and closes from Close', async () => {
    show(logRow(), { copying: true });
    expect(screen.getByRole('button', { name: 'Copy fix prompt for Claude' })).toBeDisabled();

    await press('Close');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
