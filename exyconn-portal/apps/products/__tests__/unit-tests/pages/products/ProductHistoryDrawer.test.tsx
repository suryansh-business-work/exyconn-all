import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { DocumentNode } from 'graphql';
import type { ColDef } from 'ag-grid-community';
import { FilterOp, ListStockMovementsPagedDocument } from '@exyconn/shell/graphql/generated';
import { ProductHistoryDrawer } from '../../../../src/pages/products/ProductHistoryDrawer';
import { HISTORY_COLUMNS } from '../../../../src/pages/products/products-grid';
import { renderWithProviders } from '../../test-utils';
import { movementRow, productRow } from '../../fixtures';

interface GridProps {
  columnDefs: ColDef[];
  fetchRows: unknown;
  searchPlaceholder: string;
  height: number;
}

const recorded = vi.hoisted(() => ({
  document: null as DocumentNode | null,
  select: null as ((data: never) => unknown) | null,
  filters: [] as unknown[],
  fetchRows: () => Promise.resolve({ rows: [], totalCount: 0 }),
  grid: null as unknown,
}));

vi.mock('@exyconn/crud', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/crud')>()),
  usePagedFetcher: (
    document: DocumentNode,
    select: (data: never) => unknown,
    filters: unknown[] = [],
  ) => {
    recorded.document = document;
    recorded.select = select;
    recorded.filters = filters;
    return recorded.fetchRows;
  },
}));

/** ag-grid does not lay out under jsdom; the stand-in records what the drawer hands it. */
vi.mock('@exyconn/shell/components/data/ServerDataGrid', () => ({
  ServerDataGrid: (props: Readonly<GridProps>) => {
    recorded.grid = props;
    return <p>{props.searchPlaceholder}</p>;
  },
}));

const grid = () => recorded.grid as GridProps;

describe('ProductHistoryDrawer', () => {
  beforeEach(() => {
    recorded.grid = null;
    recorded.filters = [];
  });

  it('stays closed and loads nothing while no product is chosen', () => {
    renderWithProviders(<ProductHistoryDrawer product={null} onClose={vi.fn()} />);

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(recorded.grid).toBeNull();
  });

  it('opens on the product, titled with its name, over a grid of only its movements', () => {
    renderWithProviders(
      <ProductHistoryDrawer product={productRow({ id: 'product-7' })} onClose={vi.fn()} />,
    );

    expect(screen.getByRole('heading', { name: 'Widget — stock history' })).toBeInTheDocument();
    expect(screen.getByText('Search by reference…')).toBeInTheDocument();
    expect(recorded.document).toBe(ListStockMovementsPagedDocument);
    expect(recorded.filters).toEqual([
      { field: 'productId', op: FilterOp.Equals, value: 'product-7' },
    ]);
    expect(grid()).toMatchObject({ columnDefs: HISTORY_COLUMNS, height: 480 });
    expect(grid().fetchRows).toBe(recorded.fetchRows);
  });

  it('picks the movement page off the paged query result', () => {
    renderWithProviders(<ProductHistoryDrawer product={productRow()} onClose={vi.fn()} />);
    const page = { totalCount: 1, rows: [movementRow()] };

    expect(recorded.select?.({ listStockMovementsPaged: page } as never)).toBe(page);
  });

  it('filters on the newly opened product when another one is chosen', () => {
    const onClose = vi.fn();
    const { rerender } = renderWithProviders(
      <ProductHistoryDrawer product={productRow({ id: 'product-1' })} onClose={onClose} />,
    );

    rerender(
      <ProductHistoryDrawer
        product={productRow({ id: 'product-2', name: 'Gadget' })}
        onClose={onClose}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Gadget — stock history' })).toBeInTheDocument();
    expect(recorded.filters).toEqual([
      { field: 'productId', op: FilterOp.Equals, value: 'product-2' },
    ]);
  });

  it('asks the page to close it from the close button', async () => {
    const onClose = vi.fn();
    renderWithProviders(<ProductHistoryDrawer product={productRow()} onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
