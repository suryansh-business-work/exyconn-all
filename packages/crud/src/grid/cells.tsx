import type { MouseEvent } from 'react';
import { useT } from '@exyconn/i18n';
import { gridTranslator } from '@exyconn/shell/components/data/gridContext';
import type { ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';
import { Flex, IconButton, Tooltip } from '@exyconn/shell/components/ui';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { BoolChip } from '@exyconn/shell/components/data/BoolChip';
import type { CrudGridContext, DatedCrudGridContext, RowActionSpec } from './types';
import { cellText } from '@exyconn/shell/utils/cellText';
import { EmailLink } from '@exyconn/shell/components/email';

/** Renders the column's value as the shared colour-coded status chip. */
export function StatusCell(params: Readonly<ICellRendererParams>) {
  const value: unknown = params.value;
  if (value == null) {
    return null;
  }
  return <StatusChip value={cellText(value)} />;
}

/** Renders the column's address as a link that opens the email window; blank shows nothing. */
export function EmailCell(params: Readonly<ICellRendererParams>) {
  const value: unknown = params.value;
  return <EmailLink address={typeof value === 'string' ? value : ''} />;
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
    // "Ongoing", "Never" — what an empty date says is a word a page chose, so it is copy.
    return gridTranslator(params.context)(emptyText);
  }
  return (params.context as DatedCrudGridContext<unknown>).formatDate(value);
}

/** Params the actions cell gets: the specs are pinned to the column, handlers come from context. */
type ActionCellParams = ICellRendererParams & { actionSpecs: readonly RowActionSpec[] };

/**
 * Renders the row's action buttons, resolving each spec's handler from the grid context. Each
 * shows its label as a tooltip as well as naming itself with it.
 */
export function RowActionsCell(params: Readonly<ActionCellParams>) {
  // Action names are written in the column model ("revoke device", "send contract"), which is
  // module scope and so cannot translate them itself. They are always copy, never a row's own
  // data, so translating them here is safe.
  const t = useT();
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
    <Flex direction="row" spacing={0.5}>
      {params.actionSpecs.map((spec) => {
        const handler = actions[spec.key];
        const Icon = spec.icon;
        if (spec.hidden?.(row as never)) {
          return null;
        }
        const label = t(spec.label);
        // The span keeps the tooltip working for a button that is ever disabled, which fires
        // no pointer events of its own.
        return handler ? (
          <Tooltip key={spec.key} title={label}>
            <span>
              <IconButton size="small" aria-label={label} color={spec.color} onClick={run(handler)}>
                <Icon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        ) : null;
      })}
    </Flex>
  );
}
