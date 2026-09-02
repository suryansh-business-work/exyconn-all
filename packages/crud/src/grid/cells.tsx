import type { MouseEvent } from 'react';
import type { ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';
import { Flex, IconButton } from '@exyconn/shell/components/ui';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { BoolChip } from '@exyconn/shell/components/data/BoolChip';
import type { CrudGridContext, DatedCrudGridContext, RowActionSpec } from './types';

/** Renders the column's value as the shared colour-coded status chip. */
export function StatusCell(params: Readonly<ICellRendererParams>) {
  const value: unknown = params.value;
  if (value == null) {
    return null;
  }
  return <StatusChip value={String(value)} />;
}

/** Renders the column's boolean value as a Yes/No chip. */
export function BoolCell(params: Readonly<ICellRendererParams>) {
  const value: unknown = params.value;
  if (typeof value !== 'boolean') {
    return null;
  }
  return <BoolChip value={value} />;
}

/**
 * Formats an ISO date cell through the viewer's date settings, which the page puts on
 * the grid context. `emptyText` renders for a null or blank date.
 */
export function formatDateValue(params: ValueFormatterParams, emptyText: string): string {
  const value: unknown = params.value;
  if (typeof value !== 'string' || value === '') {
    return emptyText;
  }
  return (params.context as DatedCrudGridContext<unknown>).formatDate(value);
}

/** Params the actions cell gets: the specs are pinned to the column, handlers come from context. */
type ActionCellParams = ICellRendererParams & { actionSpecs: readonly RowActionSpec[] };

/** Renders the row's action buttons, resolving each spec's handler from the grid context. */
export function RowActionsCell(params: Readonly<ActionCellParams>) {
  const row: unknown = params.data;
  const { actions } = params.context as CrudGridContext<unknown>;
  if (!row) {
    return null;
  }
  // Stop the click from also triggering the row's navigate handler.
  const run = (handler: (target: unknown) => void) => (event: MouseEvent) => {
    event.stopPropagation();
    handler(row);
  };
  return (
    <Flex direction="row" spacing={0.25}>
      {params.actionSpecs.map((spec) => {
        const handler = actions[spec.key];
        const Icon = spec.icon;
        return handler ? (
          <IconButton
            key={spec.key}
            size="small"
            aria-label={spec.label}
            color={spec.color}
            onClick={run(handler)}
          >
            <Icon fontSize="small" />
          </IconButton>
        ) : null;
      })}
    </Flex>
  );
}
