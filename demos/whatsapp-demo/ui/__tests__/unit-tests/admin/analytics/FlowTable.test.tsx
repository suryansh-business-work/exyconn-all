import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FlowTable } from '../../../../src/admin/analytics/FlowTable';
import type { FlowRow } from '../../../../src/admin/analytics/analytics.data';
import { renderWithProviders } from '../../test-utils';

const ROW: FlowRow = {
  id: 'clinic:book-visit',
  demoKey: 'clinic',
  workflow: 'book-visit',
  industry: 'Healthcare',
  name: 'Book a visit',
  started: 1500,
  completed: 1000,
  abandoned: 500,
  completionPct: 66.6,
};

describe('FlowTable', () => {
  it('lists each workflow with its counts and completion share', () => {
    renderWithProviders(<FlowTable rows={[ROW]} onSelect={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Flow breakdown' })).toBeInTheDocument();
    const headers = screen.getAllByRole('columnheader').map((cell) => cell.textContent);
    expect(headers).toEqual([
      'Industry',
      'Workflow',
      'Started',
      'Completed',
      'Abandoned',
      'Completion',
    ]);
    const cells = within(screen.getAllByRole('row')[1])
      .getAllByRole('cell')
      .map((cell) => cell.textContent);
    expect(cells).toEqual(['Healthcare', 'Book a visit', '1,500', '1,000', '500', '67%']);
  });

  it('opens a workflow by click and from the keyboard', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderWithProviders(<FlowTable rows={[ROW]} onSelect={onSelect} />);
    const row = screen.getAllByRole('row')[1];
    await user.click(row);
    expect(onSelect).toHaveBeenCalledWith(ROW);
    row.focus();
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it('says when no workflow was started', () => {
    renderWithProviders(<FlowTable rows={[]} onSelect={vi.fn()} />);
    expect(screen.getByText('No workflow was started in this period.')).toBeInTheDocument();
  });
});
