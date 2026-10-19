import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { RowClickGuard, isRowControlClick } from '../../../../src/records/list/RowClickGuard';

const AG_GRID_SKIP = '__ag_Grid_Stop_Propagation';

/** A grid row the way ag-grid draws it: a name cell with a link, and the actions cell. */
function GridRow({ onEdit }: Readonly<{ onEdit: () => void }>) {
  return (
    <div className="ag-row" role="row">
      <div className="ag-cell" col-id="name" role="gridcell">
        Acme <a href="/companies/c-1">open</a>
      </div>
      <div className="ag-cell" col-id="actions" role="gridcell" data-testid="actions-cell">
        <button type="button" onClick={onEdit}>
          <span>Edit</span>
        </button>
      </div>
    </div>
  );
}

/** Clicks `target` and reports whether ag-grid would skip its row click for it. */
function clickMarks(target: Element): boolean {
  let marked = false;
  const listener = (event: Event) => {
    marked = (event as unknown as Record<string, unknown>)[AG_GRID_SKIP] === true;
  };
  document.addEventListener('click', listener);
  fireEvent.click(target);
  document.removeEventListener('click', listener);
  return marked;
}

describe('isRowControlClick', () => {
  it('is true for a control inside a grid row, and for the actions cell itself', () => {
    render(<GridRow onEdit={vi.fn()} />);
    expect(isRowControlClick(screen.getByText('Edit'))).toBe(true);
    expect(isRowControlClick(screen.getByRole('link', { name: 'open' }))).toBe(true);
    expect(isRowControlClick(screen.getByTestId('actions-cell'))).toBe(true);
  });

  it('is false for plain cell text, a control outside a row, and a non-element', () => {
    render(
      <>
        <GridRow onEdit={vi.fn()} />
        <button type="button">Outside</button>
      </>,
    );
    expect(isRowControlClick(screen.getByText(/Acme/))).toBe(false);
    expect(isRowControlClick(screen.getByRole('button', { name: 'Outside' }))).toBe(false);
    expect(isRowControlClick(null)).toBe(false);
  });
});

describe('RowClickGuard', () => {
  it('marks a click on a row action so the row does not open, and still runs the action', () => {
    const onEdit = vi.fn();
    render(
      <RowClickGuard>
        <GridRow onEdit={onEdit} />
      </RowClickGuard>,
    );
    expect(clickMarks(screen.getByText('Edit'))).toBe(true);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('leaves a click on the row itself alone, so it still opens the quick view', () => {
    render(
      <RowClickGuard>
        <GridRow onEdit={vi.fn()} />
      </RowClickGuard>,
    );
    expect(clickMarks(screen.getByText(/Acme/))).toBe(false);
  });
});
