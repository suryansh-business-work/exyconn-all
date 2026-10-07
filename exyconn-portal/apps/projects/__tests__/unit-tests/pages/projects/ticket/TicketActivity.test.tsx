import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { TicketActivity } from '../../../../../src/pages/projects/ticket';
import { renderWithProviders } from '../../../test-utils';
import { activityFixture, type ActivityFixture } from '../projects-fixtures';

const gql = vi.hoisted(() => ({ activity: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useTaskActivityQuery: (options: unknown) => gql.activity(options),
}));

vi.mock('@exyconn/shell/hooks/useSettings', () => ({
  useSettings: () => ({ formatDateTime: (value: string) => `at ${value}` }),
}));

const answer = (entries: ActivityFixture[] | undefined, loading = false) =>
  gql.activity.mockReturnValue({ data: entries ? { taskActivity: entries } : undefined, loading });

/** The sentence an entry reads as, after the actor's name. */
function sentenceFor(overrides: Partial<ActivityFixture>): string {
  answer([activityFixture(overrides)]);
  const { unmount } = renderWithProviders(<TicketActivity taskId="task-1" />);
  const text = screen.getByText('Asha Rao').parentElement?.textContent ?? '';
  unmount();
  return text.replace('Asha Rao ', '');
}

describe('TicketActivity', () => {
  beforeEach(() => {
    gql.activity.mockReset();
  });

  it('lists who did what and when, asking for the ticket history', () => {
    answer([activityFixture()]);
    renderWithProviders(<TicketActivity taskId="task-1" />);

    expect(screen.getByText('History (1)')).toBeInTheDocument();
    expect(screen.getByText('AR')).toBeInTheDocument();
    expect(screen.getByText('at 2026-10-02T09:00:00.000Z')).toBeInTheDocument();
    expect(gql.activity).toHaveBeenCalledWith({
      variables: { taskId: 'task-1' },
      fetchPolicy: 'cache-and-network',
    });
  });

  it('writes a change from one value to another', () => {
    expect(sentenceFor({})).toBe('changed priority from High to Highest');
  });

  it('writes a first value as set, and an emptied one as cleared', () => {
    expect(sentenceFor({ field: 'assignee', fromValue: '', toValue: 'Priya' })).toBe(
      'set assignee to Priya',
    );
    expect(sentenceFor({ field: 'assignee', fromValue: 'Priya', toValue: '' })).toBe(
      'cleared assignee',
    );
  });

  it('writes the creation of the ticket', () => {
    expect(sentenceFor({ field: 'created', fromValue: '', toValue: 'EXY-1' })).toBe(
      'created EXY-1',
    );
  });

  it('writes attachments added and removed by file name', () => {
    expect(sentenceFor({ field: 'attachment', fromValue: '', toValue: 'spec.pdf' })).toBe(
      'attached spec.pdf',
    );
    expect(sentenceFor({ field: 'attachment', fromValue: 'old.png', toValue: '' })).toBe(
      'removed attachment old.png',
    );
  });

  it('shows a spinner on the first load only', () => {
    answer(undefined, true);
    renderWithProviders(<TicketActivity taskId="task-1" />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('Nothing has changed on this ticket yet.')).not.toBeInTheDocument();
  });

  it('says so when nothing has happened yet', () => {
    answer([], true);
    renderWithProviders(<TicketActivity taskId="task-1" />);

    expect(screen.getByText('History (0)')).toBeInTheDocument();
    expect(screen.getByText('Nothing has changed on this ticket yet.')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
