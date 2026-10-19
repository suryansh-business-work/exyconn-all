import type { MouseEvent, ReactNode } from 'react';
import { Box } from '@exyconn/shell/components/ui';

/**
 * What counts as a control inside a grid row: anything a person clicks to act rather than to
 * open the row, plus the whole actions cell (its padding included).
 */
const ROW_CONTROL = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  'label',
  '[role="button"]',
  '[role="checkbox"]',
  '[role="menuitem"]',
  '[role="switch"]',
  '[role="link"]',
  '.ag-cell[col-id="actions"]',
].join(', ');

/** ag-grid skips its row click for an event carrying this flag (its own stop-propagation mark). */
const AG_GRID_SKIP = '__ag_Grid_Stop_Propagation';

/** Whether a click landed on a control inside a grid row, so it must not open the row. */
export function isRowControlClick(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false;
  }
  return Boolean(target.closest(ROW_CONTROL)?.closest('.ag-row'));
}

/**
 * Marks a click on a row's control so the grid's row click (open the quick view) ignores it.
 * It runs in the capture phase, before ag-grid sees the click, and only marks the event: the
 * control's own handler still runs.
 */
function markControlClick(event: MouseEvent) {
  if (isRowControlClick(event.target)) {
    Object.assign(event.nativeEvent, { [AG_GRID_SKIP]: true });
  }
}

/**
 * Wraps a CRM list so Edit, Delete, Make client, a menu or a link in a row acts on its own
 * instead of also opening the row. Adds no box of its own, so the layout is unchanged.
 */
export function RowClickGuard({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <Box sx={{ display: 'contents' }} onClickCapture={markControlClick}>
      {children}
    </Box>
  );
}
