import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { I18nProvider } from '@exyconn/i18n';
import { PurchaseOrderStatus } from '@exyconn/shell/graphql/generated';
import {
  PurchaseOrderForm,
  type PurchaseOrderRow,
} from '../../../../../../src/pages/purchase-orders/forms/purchase-order';
import { renderWithProviders } from '../../../../test-utils';
import {
  answered,
  orderLine,
  productRow,
  purchaseOrderRow,
  supplierRow,
} from '../../../../fixtures';
import { chooseOption, pickerInput, press, setNumber } from '../../../../form-helpers';

const gql = vi.hoisted(() => ({
  suppliers: vi.fn(),
  products: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListSuppliersQuery: () => gql.suppliers(),
  useListProductsQuery: () => gql.products(),
  useCreatePurchaseOrderMutation: () => [gql.create],
  useUpdatePurchaseOrderMutation: () => [gql.update],
}));

const NO_MESSAGES = {};
const COMPANY = { currency: 'INR' };

/** Renders the form inside the company's settings, unless `withCurrency` is false. */
function renderForm(initial: PurchaseOrderRow | null = null, withCurrency = true) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  const form = <PurchaseOrderForm initial={initial} onDone={onDone} onCancel={onCancel} />;
  renderWithProviders(
    withCurrency ? (
      <I18nProvider locale="en" messages={NO_MESSAGES} settings={COMPANY}>
        {form}
      </I18nProvider>
    ) : (
      form
    ),
  );
  return { onDone, onCancel };
}

describe('PurchaseOrderForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.suppliers.mockReturnValue(answered({ listSuppliers: [supplierRow()] }));
    gql.products.mockReturnValue(answered({ listProducts: [productRow()] }));
    gql.create.mockResolvedValue({ data: { createPurchaseOrder: { id: 'po-9' } } });
    gql.update.mockResolvedValue({ data: { updatePurchaseOrder: { id: 'po-1' } } });
  });

  it('requires a supplier, at least one line and an order date', async () => {
    renderForm();

    await press('Create');

    expect(await screen.findByText('Choose a supplier')).toBeInTheDocument();
    expect(screen.getByText('Add at least one line')).toBeInTheDocument();
    expect(screen.getByText('Order date is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('requires a currency when the company has none set', async () => {
    renderForm(null, false);

    await press('Create');

    expect(await screen.findByText('Currency is required')).toBeInTheDocument();
  });

  it('checks every line for a product, whole units, a cost and a sane tax rate', async () => {
    renderForm();
    await press('Add line');
    setNumber('Qty', '0');
    setNumber('Unit cost', '-1');
    setNumber('Tax %', '120');

    await press('Create');

    expect(await screen.findByText('Choose a product')).toBeInTheDocument();
    expect(screen.getByText('At least 1')).toBeInTheDocument();
    expect(screen.getByText('Must be ≥ 0')).toBeInTheDocument();
    expect(screen.getByText('Must be ≤ 100')).toBeInTheDocument();

    setNumber('Qty', '1.5');
    expect(await screen.findByText('Whole units only')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('raises a draft in the company currency, with no expected date stored as null', async () => {
    const { onDone } = renderForm();
    await chooseOption('Supplier', 'Acme Supplies (ACME-01)');
    await press('Add line');
    await chooseOption('Product', 'Widget — WID-1');
    setNumber('Qty', '3');
    setNumber('Unit cost', '10');
    setNumber('Tax %', '18');
    fireEvent.change(pickerInput('orderDate'), { target: { value: '03/04/2026' } });

    expect(screen.getByText('35.4')).toBeInTheDocument();
    expect(screen.getByText(`Total ${(35.4).toLocaleString()}`)).toBeInTheDocument();
    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          supplierId: 'supplier-1',
          lines: [{ productId: 'product-1', quantity: 3, unitCost: 10, taxPercent: 18 }],
          currency: 'INR',
          status: PurchaseOrderStatus.Draft,
          orderDate: new Date(2026, 2, 4).toISOString(),
          expectedDate: null,
          notes: '',
        },
      },
    });
    expect(await screen.findByText('Purchase order created')).toBeInTheDocument();
  });

  it('updates an order by id with its lines, dates and notes, leaving received counts out', async () => {
    const row = purchaseOrderRow({
      id: 'po-1',
      currency: 'USD',
      expectedDate: '2026-03-20T00:00:00.000Z',
      notes: 'Rush',
      lines: [orderLine({ receivedQuantity: 4 })],
    });
    const { onDone } = renderForm(row);

    expect(screen.getByText('1180')).toBeInTheDocument();
    await chooseOption('Status', 'Partially Received');
    await press('Update');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'po-1',
        input: {
          supplierId: 'supplier-1',
          lines: [{ productId: 'product-1', quantity: 10, unitCost: 100, taxPercent: 18 }],
          currency: 'USD',
          status: PurchaseOrderStatus.PartiallyReceived,
          orderDate: '2026-03-04T00:00:00.000Z',
          expectedDate: '2026-03-20T00:00:00.000Z',
          notes: 'Rush',
        },
      },
    });
    expect(await screen.findByText('Purchase order updated')).toBeInTheDocument();
  });

  it('keeps the form open and shows why a save failed', async () => {
    gql.update.mockRejectedValueOnce(new Error('Supplier is on hold'));
    const { onDone } = renderForm(purchaseOrderRow());

    await press('Update');

    expect(await screen.findByText('Supplier is on hold')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('cancels without saving', async () => {
    const { onCancel } = renderForm();

    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(gql.create).not.toHaveBeenCalled();
  });
});
