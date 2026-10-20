import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useSetDefaultWorkDaysMutation, useWorkWeekQuery } from '@exyconn/shell/graphql/generated';
import { WorkWeekTab } from '../../../../src/pages/leave-settings/WorkWeekTab';
import { renderWithProviders } from '../../test-utils';
import { mutationTuple, queryResult } from '../../harness/gql-doubles';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useWorkWeekQuery: vi.fn(),
  useSetDefaultWorkDaysMutation: vi.fn(),
}));

const save = vi.fn();
const WEEK = { workWeek: { __typename: 'WorkWeek' as const, defaultWorkDays: [1, 2, 3, 4, 5] } };

function renderTab(result: ReturnType<typeof queryResult>) {
  vi.mocked(useWorkWeekQuery).mockReturnValue(result as never);
  renderWithProviders(<WorkWeekTab />);
}

describe('WorkWeekTab', () => {
  beforeEach(() => {
    save.mockReset().mockResolvedValue({ data: { setDefaultWorkDays: WEEK.workWeek } });
    vi.mocked(useSetDefaultWorkDaysMutation).mockReturnValue(mutationTuple(save) as never);
  });

  it('shows a skeleton, not the form, while the week first loads', () => {
    renderTab(queryResult(undefined, { loading: true }));
    expect(screen.queryByRole('group', { name: 'Work days' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Save work week' })).toBeNull();
  });

  it('shows the saved week once it has loaded', () => {
    renderTab(queryResult(WEEK));
    expect(screen.getByRole('group', { name: 'Work days' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Monday' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Sunday' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('keeps the form while a refresh is loading', () => {
    renderTab(queryResult(WEEK, { loading: true }));
    expect(screen.getByRole('group', { name: 'Work days' })).toBeInTheDocument();
  });

  it('says why the week could not be loaded', () => {
    renderTab(queryResult(undefined, { error: new Error('Work week unavailable') }));
    expect(screen.getByRole('alert')).toHaveTextContent('Work week unavailable');
    expect(screen.queryByRole('group', { name: 'Work days' })).toBeNull();
  });

  it('reloads the week after it is saved', async () => {
    const result = queryResult(WEEK);
    renderTab(result);
    await userEvent.click(screen.getByRole('button', { name: 'Save work week' }));
    await waitFor(() => expect(result.refetch).toHaveBeenCalledTimes(1));
  });

  it('reloads the saved week on cancel, and logs a reload that fails', async () => {
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    const failure = new Error('offline');
    const result = queryResult(WEEK, { refetch: vi.fn().mockRejectedValue(failure) });
    renderTab(result);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(result.refetch).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith('Could not reload the work week', failure),
    );
    warn.mockRestore();
  });
});
