import { describe, expect, it } from 'vitest';
import { budgetColumns } from '../../../../src/pages/budgets/budgets-grid';
import { budgetRow } from '../../fixtures';
import { actionSpecs, columnIds, formatCell } from '../../grid-helpers';

const NAMES: Record<string, string> = { 'centre-1': 'ENG' };
const columns = budgetColumns((id) => NAMES[id] ?? 'unknown');

describe('budgetColumns', () => {
  it('lists the centre, month, budget and note, with edit and delete last', () => {
    expect(columnIds(columns)).toEqual(['costCentre', 'month', 'amount', 'note', 'actions']);
    expect(actionSpecs(columns).map((spec) => spec.key)).toEqual(['edit', 'delete']);
  });

  it('names the centre through the lookup the page hands in', () => {
    expect(formatCell(columns, 'costCentre', budgetRow())).toBe('ENG');
    expect(formatCell(columns, 'costCentre', budgetRow({ costCenterId: 'centre-9' }))).toBe(
      'unknown',
    );
  });

  it('writes the budget in its own currency', () => {
    expect(formatCell(columns, 'amount', budgetRow({ amount: 500, currency: 'USD' }))).toBe(
      'USD 500',
    );
  });

  it('cannot sort or filter by the centre, which the server does not store as text', () => {
    const centre = columns.find((column) => column.colId === 'costCentre');

    expect(centre).toMatchObject({ sortable: false, filter: false });
  });
});
