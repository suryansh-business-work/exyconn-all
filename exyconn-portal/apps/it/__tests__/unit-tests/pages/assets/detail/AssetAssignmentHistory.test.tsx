import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { AssetAssignmentHistory, type AssignmentRow } from '../../../../../src/pages/assets/detail';
import { formatDate } from '../../../core/settings.mock';
import { press } from '../../../core/form.helpers';
import { renderWithProviders } from '../../../test-utils';

const spell = (overrides: Partial<AssignmentRow>): AssignmentRow => ({
  id: 'as-1',
  assetTag: 'LT-001',
  employeeId: 'emp-1',
  employeeName: 'Ana Rao',
  assignedAt: '2025-01-01',
  returnedAt: '2025-06-30',
  assignedByName: 'Ravi',
  note: 'Swapped for a newer model',
  ...overrides,
});

const renderHistory = (rows: AssignmentRow[], onRefresh = vi.fn().mockResolvedValue({})) =>
  renderWithProviders(
    <AssetAssignmentHistory
      rows={rows}
      loading={false}
      onRefresh={onRefresh}
      formatDate={formatDate}
    />,
  );

describe('AssetAssignmentHistory', () => {
  it('says the asset has never been assigned when there is no history', () => {
    renderHistory([]);
    expect(screen.getByText('Assignment history (0)')).toBeInTheDocument();
    expect(screen.getByText('This asset has never been assigned.')).toBeInTheDocument();
  });

  it('shows each spell: who, from when, until when, handed over by whom and why', () => {
    renderHistory([spell({})]);
    const row = screen.getAllByRole('row')[1];
    expect(within(row).getByText('Ana Rao')).toBeInTheDocument();
    expect(within(row).getByText('on 2025-01-01')).toBeInTheDocument();
    expect(within(row).getByText('on 2025-06-30')).toBeInTheDocument();
    expect(within(row).getByText('Ravi')).toBeInTheDocument();
    expect(within(row).getByText('Swapped for a newer model')).toBeInTheDocument();
  });

  it('marks the open spell as still held and dashes what was not recorded', () => {
    renderHistory([
      spell({ id: 'as-2', employeeName: '', returnedAt: null, assignedByName: '', note: '' }),
    ]);
    const row = screen.getAllByRole('row')[1];
    expect(within(row).getByText('emp-1')).toBeInTheDocument();
    expect(within(row).getByText('Still held')).toBeInTheDocument();
    expect(within(row).getAllByText('—')).toHaveLength(2);
    expect(screen.getByText('Assignment history (1)')).toBeInTheDocument();
  });

  it('re-reads the history from its refresh button', async () => {
    const onRefresh = vi.fn().mockResolvedValue({});
    renderHistory([spell({})], onRefresh);
    await press('Refresh table');
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
