import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListProductsPagedDocument } from '@exyconn/shell/graphql/generated';
import { ProductsPage } from '../../../../src/pages/products';
import { PRODUCT_COLUMNS } from '../../../../src/pages/products/products-grid';
import { renderWithProviders } from '../../test-utils';
import { pending, productRow, tableStats } from '../../fixtures';
import { dashboardProps, paged } from '../../crud-dashboard-stub';
import { confirmRowDelete, runRowAction, statLines } from '../../crud-page-helpers';

const gql = vi.hoisted(() => ({ stats: vi.fn(), refetch: vi.fn(), deleteProduct: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListProductsStatsQuery: () => gql.stats(),
  useDeleteProductMutation: () => [gql.deleteProduct],
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../../crud-dashboard-stub');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('../../../../src/pages/products/forms/product', async () => ({
  ProductForm: (await import('../../form-stub')).FormStub,
}));

/** The drawer has its own test; here it only shows which product it was opened for. */
vi.mock('../../../../src/pages/products/ProductHistoryDrawer', () => ({
  ProductHistoryDrawer: ({
    product,
    onClose,
  }: Readonly<{ product: { name: string } | null; onClose: () => void }>) =>
    product ? (
      <div>
        <p>{`History of ${product.name}`}</p>
        <button type="button" onClick={onClose}>
          Close history
        </button>
      </div>
    ) : null,
}));

describe('ProductsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.deleteProduct.mockResolvedValue({ data: { deleteProduct: true } });
    gql.stats.mockReturnValue({
      data: {
        listProductsStats: tableStats(12, { status: { ACTIVE: 7, ARCHIVED: 2 } }, { stock: 340 }),
      },
      loading: false,
      refetch: gql.refetch,
    });
  });

  it('counts the catalogue, its active lines, the units in stock and the archive', () => {
    renderWithProviders(<ProductsPage />);

    expect(statLines()).toEqual(['Products: 12', 'Active: 7', 'In stock: 340', 'Archived: 2']);
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('marks the tiles loading and shows zeros until the stats answer', () => {
    gql.stats.mockReturnValue(pending());
    renderWithProviders(<ProductsPage />);

    expect(dashboardProps().statsLoading).toBe(true);
    expect(statLines()).toEqual(['Products: 0', 'Active: 0', 'In stock: 0', 'Archived: 0']);
  });

  it('drives the server grid with the paged products query and the product columns', () => {
    renderWithProviders(<ProductsPage />);
    const page = { totalCount: 1, rows: [productRow()] };

    expect(paged.document).toBe(ListProductsPagedDocument);
    expect(paged.select?.({ listProductsPaged: page } as never)).toBe(page);
    expect(dashboardProps().columnDefs).toBe(PRODUCT_COLUMNS);
    expect(dashboardProps()).toMatchObject({ title: 'Products', exportFileName: 'products' });
  });

  it('opens the form blank for a new product and with the row for an edit', async () => {
    renderWithProviders(<ProductsPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));
    expect(screen.getByText('Blank form')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));
    expect(screen.queryByText('Blank form')).not.toBeInTheDocument();

    await runRowAction('edit', productRow({ name: 'Gadget' }));
    expect(screen.getByText(/"name":"Gadget"/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
    expect(screen.queryByText(/Gadget/)).not.toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('opens and closes one product’s stock history', async () => {
    renderWithProviders(<ProductsPage />);
    expect(screen.queryByText(/History of/)).not.toBeInTheDocument();

    await runRowAction('history', productRow({ name: 'Gadget' }));
    expect(screen.getByText('History of Gadget')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Close history' }));
    expect(screen.queryByText(/History of/)).not.toBeInTheDocument();
  });

  it('deletes a product after confirming, by its id', async () => {
    renderWithProviders(<ProductsPage />);

    await confirmRowDelete(productRow({ id: 'product-4' }), 'Delete product "Widget"?');

    expect(gql.deleteProduct).toHaveBeenCalledWith({ variables: { id: 'product-4' } });
    expect(await screen.findByText('Product deleted')).toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });
});
