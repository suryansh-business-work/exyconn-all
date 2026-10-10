import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { formatMoney } from '@exyconn/shell/utils/money';
import { ProductsOverviewPage } from '../../../../src/pages/products';
import { renderWithProviders } from '../../test-utils';
import { answered, pending, productRow, tableStats } from '../../fixtures';

interface OverviewProps {
  title: string;
  stats: { label: string; value: string }[];
  statsLoading: boolean;
  breakdowns: { title: string; buckets: unknown[] }[];
  links: { label: string; to: string }[];
  recentTitle: string;
  children: ReactNode;
}

interface TableColumn {
  key: string;
  render?: (row: Record<string, unknown>) => ReactNode;
}

interface TableProps {
  columns: TableColumn[];
  rows: Record<string, unknown>[];
  emptyMessage: string;
  loading: boolean;
  onRefresh: () => unknown;
}

const recorded = vi.hoisted(() => {
  const hooks: Record<string, () => unknown> = {};
  return { overview: null as unknown, table: null as unknown, hooks };
});

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListProductsStatsQuery: () => recorded.hooks.stats(),
  useInventoryValueQuery: () => recorded.hooks.value(),
  useListProductsQuery: () => recorded.hooks.products(),
}));

vi.mock('@exyconn/shell/components/dashboard/ModuleOverview', () => ({
  ModuleOverview: (props: Readonly<OverviewProps>) => {
    recorded.overview = props;
    return <section aria-label="overview">{props.children}</section>;
  },
}));

/** Renders each row cell by cell, as the shared table does: a column's render, else the value. */
vi.mock('@exyconn/shell/components/data/DataTable', () => ({
  DataTable: (props: Readonly<TableProps>) => {
    recorded.table = props;
    return (
      <table>
        <tbody>
          {props.rows.map((row) => (
            <tr key={String(row.id)}>
              {props.columns.map((column) => (
                <td key={column.key}>{column.render?.(row) ?? String(row[column.key])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  },
}));

const overview = () => recorded.overview as OverviewProps;
const table = () => recorded.table as TableProps;
const stat = (label: string) => overview().stats.find((item) => item.label === label)?.value;

/** Ten healthy products, newest first. */
const healthy = () =>
  Array.from({ length: 10 }, (_, index) =>
    productRow({ id: `product-${index}`, name: `Product ${index}`, stock: 50, reorderLevel: 5 }),
  );

const loadedHooks = () => ({
  stats: () =>
    answered({
      listProductsStats: tableStats(
        24,
        { category: { Hardware: 14, Software: 10 }, status: { ACTIVE: 20, DRAFT: 4 } },
        { stock: 900 },
      ),
    }),
  value: () => answered({ inventoryValue: 125000 }),
  products: () => answered({ listProducts: healthy() }),
});

describe('ProductsOverviewPage', () => {
  beforeEach(() => {
    recorded.hooks = loadedHooks();
  });

  it('shows the catalogue size, units, low-stock count and value as money', () => {
    renderWithProviders(<ProductsOverviewPage />);

    expect(overview().title).toBe('Products');
    expect(overview().statsLoading).toBe(false);
    expect(stat('Products')).toBe('24');
    expect(stat('Units in stock')).toBe('900');
    expect(stat('Low stock')).toBe('0');
    expect(stat('Catalogue value')).toBe(formatMoney(125000));
  });

  it('breaks the catalogue down by category and by status', () => {
    renderWithProviders(<ProductsOverviewPage />);

    expect(overview().breakdowns).toEqual([
      expect.objectContaining({
        title: 'By category',
        buckets: [
          { value: 'Hardware', count: 14 },
          { value: 'Software', count: 10 },
        ],
      }),
      expect.objectContaining({
        title: 'By status',
        buckets: [
          { value: 'ACTIVE', count: 20 },
          { value: 'DRAFT', count: 4 },
        ],
      }),
    ]);
    expect(overview().links).toEqual([{ label: 'Open catalogue', to: '/products/catalogue' }]);
  });

  it('lists the eight newest products when nothing is running low', () => {
    renderWithProviders(<ProductsOverviewPage />);

    expect(overview().recentTitle).toBe('Newest products');
    expect(table().rows).toHaveLength(8);
    expect(table().rows[0]).toMatchObject({ id: 'product-0' });
    expect(table().emptyMessage).toBe('No products yet.');
    const firstRow = within(screen.getAllByRole('row')[0]);
    expect(firstRow.getByText('Product 0')).toBeInTheDocument();
    expect(firstRow.getByText('ACTIVE')).toBeInTheDocument();
    expect(firstRow.getByText(formatMoney(250))).toBeInTheDocument();
  });

  it('lists only what is at or below its own reorder level when something is running low', () => {
    const products = [
      productRow({ id: 'a', name: 'Plenty', stock: 50, reorderLevel: 5 }),
      productRow({ id: 'b', name: 'At the line', stock: 10, reorderLevel: 10 }),
      productRow({ id: 'c', name: 'Empty', stock: 0, reorderLevel: 2 }),
    ];
    recorded.hooks.products = () => answered({ listProducts: products });
    renderWithProviders(<ProductsOverviewPage />);

    expect(overview().recentTitle).toBe('Running low');
    expect(stat('Low stock')).toBe('2');
    expect(table().rows.map((row) => row.id)).toEqual(['b', 'c']);
  });

  it('caps a long low-stock list at eight', () => {
    const low = Array.from({ length: 11 }, (_, index) =>
      productRow({ id: `low-${index}`, stock: 1, reorderLevel: 5 }),
    );
    recorded.hooks.products = () => answered({ listProducts: low });
    renderWithProviders(<ProductsOverviewPage />);

    expect(stat('Low stock')).toBe('11');
    expect(table().rows).toHaveLength(8);
  });

  it.each(['stats', 'value', 'products'])(
    'marks the tiles loading while %s has not answered',
    (hook) => {
      recorded.hooks = { ...loadedHooks(), [hook]: pending };
      renderWithProviders(<ProductsOverviewPage />);

      expect(overview().statsLoading).toBe(true);
    },
  );

  it('shows zeros, empty breakdowns and an empty loading table before anything answers', () => {
    recorded.hooks = { stats: pending, value: pending, products: pending };
    renderWithProviders(<ProductsOverviewPage />);

    expect(stat('Products')).toBe('0');
    expect(stat('Units in stock')).toBe('0');
    expect(stat('Catalogue value')).toBe(formatMoney(0));
    expect(overview().breakdowns.map((breakdown) => breakdown.buckets)).toEqual([[], []]);
    expect(table().rows).toEqual([]);
    expect(table().loading).toBe(true);
  });
});
