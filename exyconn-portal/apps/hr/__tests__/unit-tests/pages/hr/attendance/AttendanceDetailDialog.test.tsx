import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AttendanceDetailDialog } from '../../../../../src/pages/hr/attendance/AttendanceDetailDialog';
import { renderWithProviders } from '../../../test-utils';
import { emptyDay, trackedDay } from './attendance-fixture';

/** The value printed under a fact's label. */
function fact(label: string): string | null {
  const labelNode = screen.getByText(label, { selector: 'span, p' });
  return labelNode.nextElementSibling?.textContent ?? null;
}

describe('AttendanceDetailDialog', () => {
  it('renders nothing while no day is chosen', () => {
    renderWithProviders(<AttendanceDetailDialog entry={null} onClose={vi.fn()} />);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('shows who, the status, the date and the record’s own facts', () => {
    renderWithProviders(<AttendanceDetailDialog entry={trackedDay} onClose={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Asha Rao' })).toBeInTheDocument();
    expect(screen.getByText('PRESENT')).toBeInTheDocument();
    expect(screen.getByText('04 Mar 2026')).toBeInTheDocument();
    expect(fact('Email')).toBe('asha@example.com');
    expect(fact('Designation')).toBe('Engineer');
    expect(fact('Department')).toBe('Engineering');
    expect(fact('Note')).toBe('Client visit');
  });

  it('keeps measured and claimed tracker time apart', () => {
    renderWithProviders(<AttendanceDetailDialog entry={trackedDay} onClose={vi.fn()} />);
    expect(fact('Active time')).toBe('6h 30m');
    expect(fact('Idle time')).toBe('30m');
    expect(fact('Activity')).toBe('93%');
    expect(fact('Sessions')).toBe('3');
    expect(fact('First started')).toBe('09:05 AM');
    expect(fact('Last ended')).toBe('05:40 PM');
  });

  it('breaks the day down by project, naming time with no project', () => {
    renderWithProviders(<AttendanceDetailDialog entry={trackedDay} onClose={vi.fn()} />);
    const rows = within(screen.getByRole('table', { name: 'Time by project' })).getAllByRole('row');
    const cells = rows.map((row) =>
      within(row)
        .queryAllByRole('cell')
        .map((cell) => cell.textContent),
    );
    expect(cells.slice(1)).toEqual([
      ['Website', '5h 0m', '—', '2'],
      ['No project', '1h 30m', '45m', '1'],
    ]);
  });

  it('writes dashes for a day nothing was tracked or filled in', () => {
    renderWithProviders(<AttendanceDetailDialog entry={emptyDay} onClose={vi.fn()} />);
    expect(fact('Email')).toBe('—');
    expect(fact('Designation')).toBe('—');
    expect(fact('Department')).toBe('—');
    expect(fact('Note')).toBe('—');
    expect(fact('Active time')).toBe('—');
    expect(fact('Activity')).toBe('—');
    expect(fact('First started')).toBe('—');
    expect(fact('Last ended')).toBe('—');
    expect(screen.getByText('Nothing was tracked on this day.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('closes from its close button', async () => {
    const onClose = vi.fn();
    renderWithProviders(<AttendanceDetailDialog entry={trackedDay} onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
