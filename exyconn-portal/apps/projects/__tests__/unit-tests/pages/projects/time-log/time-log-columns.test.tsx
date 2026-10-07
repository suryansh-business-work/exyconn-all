import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { timeLogColumns, type TimeLogRow } from '../../../../../src/pages/projects/time-log';
import { renderWithProviders } from '../../../test-utils';
import { timeLogRow } from '../projects-fixtures';

/** What one column draws for a row. */
function cell(key: string, row: TimeLogRow) {
  const column = timeLogColumns.find((candidate) => candidate.key === key);
  if (!column?.render) throw new Error(`Column ${key} has no renderer`);
  return column.render(row);
}

describe('timeLogColumns', () => {
  it('summarises who, ticket, tracked and idle time, runs and screenshots', () => {
    expect(timeLogColumns.map((column) => column.label)).toEqual([
      'Who',
      'Ticket',
      'Tracked',
      'Idle',
      'Sessions',
      'Shots',
    ]);
    expect(timeLogColumns[0].render).toBeUndefined();
  });

  it('shows the ticket key and title', () => {
    renderWithProviders(<>{cell('ticket', timeLogRow())}</>);

    expect(screen.getByText('WEB-1')).toBeInTheDocument();
    expect(screen.getByText('Landing page')).toBeInTheDocument();
  });

  it('labels time booked to no ticket rather than leaving it blank', () => {
    renderWithProviders(<>{cell('ticket', timeLogRow({ taskKey: '', taskTitle: '' }))}</>);

    expect(screen.getByText('No ticket')).toBeInTheDocument();
  });

  it('shows tracked time alone when nothing was claimed off-computer', () => {
    renderWithProviders(<>{cell('activeMs', timeLogRow())}</>);

    expect(screen.getByText('1h 30m')).toBeInTheDocument();
    expect(screen.queryByText(/off-computer/)).not.toBeInTheDocument();
  });

  it('keeps off-computer time on its own line, never added to tracked time', () => {
    renderWithProviders(<>{cell('activeMs', timeLogRow({ manualMs: 2_700_000 }))}</>);

    expect(screen.getByText('1h 30m')).toBeInTheDocument();
    expect(screen.getByText('+ 45m off-computer')).toBeInTheDocument();
  });

  it('writes idle time, runs and screenshot counts', () => {
    const row = timeLogRow();

    expect(cell('idleMs', row)).toBe('10m');
    expect(cell('sessions', row)).toBe('2');
    expect(cell('screenshots', row)).toBe('6');
  });
});
