import { vi } from 'vitest';
import type { ServerDataGridProps } from '@exyconn/shell/components/data/ServerDataGrid.types';
import { actionsColumn, textColumn } from '../../../src/grid/columns';
import type { CrudResource } from '../../../src/page/useCrudResource';

export interface Lead {
  id: string;
  name: string;
}

export const acme: Lead = { id: 'l1', name: 'Acme' };

export const leadColumns = [textColumn<Lead>('name', 'Name'), actionsColumn<Lead>()];

export const fetchLeads = () => vi.fn(() => Promise.resolve({ rows: [acme], totalCount: 1 }));

/** What the dashboard handed the grid on its latest render. */
export const gridProps: { current: ServerDataGridProps<Lead> | null } = { current: null };

/**
 * A light stand-in for the lazily loaded ag-grid: it records its props and exposes the two
 * callbacks a page wires up, so a test can drive them.
 */
export function GridStub(props: Readonly<ServerDataGridProps<Lead>>) {
  gridProps.current = props;
  return (
    <div data-testid="grid">
      <span>{props.searchPlaceholder}</span>
      <button type="button" onClick={() => props.onRowClick?.(acme)}>
        open row
      </button>
      <button
        type="button"
        onClick={() => props.onQuery?.({ search: 'acme', sort: null, filters: [] })}
      >
        query grid
      </button>
    </div>
  );
}

export const crudResource = (
  overrides: Partial<CrudResource<Lead, Lead>> = {},
): CrudResource<Lead, Lead> => ({
  open: false,
  editing: null,
  openCreate: vi.fn(),
  openEdit: vi.fn(),
  close: vi.fn(),
  refreshSignal: 5,
  reload: vi.fn(),
  onDone: vi.fn(),
  remove: vi.fn(() => Promise.resolve()),
  ...overrides,
});

export const stats = [{ label: 'Open leads', value: '12' }];
