import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PurchaseOrderForm } from '../../../../../../src/pages/purchase-orders/forms/purchase-order';
import { renderWithProviders } from '../../../../test-utils';
import { answered, pending, productRow, supplierRow } from '../../../../fixtures';
import { optionsOf, press } from '../../../../form-helpers';

const gql = vi.hoisted(() => ({ suppliers: vi.fn(), products: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListSuppliersQuery: () => gql.suppliers(),
  useListProductsQuery: () => gql.products(),
  useCreatePurchaseOrderMutation: () => [vi.fn()],
  useUpdatePurchaseOrderMutation: () => [vi.fn()],
}));

async function renderWithOneLine() {
  renderWithProviders(<PurchaseOrderForm initial={null} onDone={vi.fn()} onCancel={vi.fn()} />);
  await press('Add line');
}

describe('PurchaseOrderForm pick lists', () => {
  beforeEach(() => {
    gql.suppliers.mockReturnValue(
      answered({
        listSuppliers: [
          supplierRow(),
          supplierRow({ id: 'supplier-2', name: 'Globex Parts', code: 'GLX' }),
        ],
      }),
    );
    gql.products.mockReturnValue(answered({ listProducts: [productRow()] }));
  });

  it('names suppliers with their code and products with their SKU', async () => {
    await renderWithOneLine();

    expect(await optionsOf('Supplier')).toEqual(['Acme Supplies (ACME-01)', 'Globex Parts (GLX)']);
    expect(await optionsOf('Product')).toEqual(['Widget — WID-1']);
  });

  it('offers every order status in words', async () => {
    await renderWithOneLine();

    expect(await optionsOf('Status')).toEqual([
      'Cancelled',
      'Draft',
      'Ordered',
      'Partially Received',
      'Received',
    ]);
  });

  it('offers nothing to pick while the lists are loading', async () => {
    gql.suppliers.mockReturnValue(pending());
    gql.products.mockReturnValue(pending());
    await renderWithOneLine();

    expect(await optionsOf('Supplier')).toEqual([]);
    expect(await optionsOf('Product')).toEqual([]);
  });
});
