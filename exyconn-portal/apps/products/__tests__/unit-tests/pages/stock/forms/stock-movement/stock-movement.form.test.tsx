import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { MovementReason } from '@exyconn/shell/graphql/generated';
import { StockMovementForm } from '../../../../../../src/pages/stock/forms/stock-movement';
import { renderWithProviders } from '../../../../test-utils';
import { answered, pending, productRow, supplierRow } from '../../../../fixtures';
import { chooseOption, fillField, optionsOf, press, setNumber } from '../../../../form-helpers';

const gql = vi.hoisted(() => ({ products: vi.fn(), suppliers: vi.fn(), record: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListProductsQuery: () => gql.products(),
  useListSuppliersQuery: () => gql.suppliers(),
  useRecordStockMovementMutation: () => [gql.record],
}));

function renderForm() {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(<StockMovementForm onDone={onDone} onCancel={onCancel} />);
  return { onDone, onCancel };
}

describe('StockMovementForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.products.mockReturnValue(
      answered({ listProducts: [productRow({ id: 'product-1', name: 'Widget', stock: 12 })] }),
    );
    gql.suppliers.mockReturnValue(answered({ listSuppliers: [supplierRow()] }));
    gql.record.mockResolvedValue({
      data: { recordStockMovement: { id: 'movement-9', stockAfter: 16 } },
    });
  });

  it('names each product with its level, each supplier by code, and every reason', async () => {
    renderForm();

    expect(await optionsOf('Product')).toEqual(['Widget — 12 in stock']);
    expect(await optionsOf('Supplier')).toEqual(['ACME-01 — Acme Supplies']);
    expect(await optionsOf('Reason')).toEqual(['Count', 'Issue', 'Receipt', 'Return', 'Write Off']);
  });

  it('offers nothing to pick while the lists are loading', async () => {
    gql.products.mockReturnValue(pending());
    gql.suppliers.mockReturnValue(pending());
    renderForm();

    expect(await optionsOf('Product')).toEqual([]);
    expect(await optionsOf('Supplier')).toEqual([]);
  });

  it('asks for a product before it can show the effect', () => {
    renderForm();

    expect(screen.getByText('Choose a product to see the effect.')).toBeInTheDocument();
  });

  it('previews what each reason does to the level before it is recorded', async () => {
    renderForm();
    await chooseOption('Product', 'Widget — 12 in stock');

    expect(screen.getByText('12 → 13')).toBeInTheDocument();
    setNumber('Quantity', '5');
    expect(screen.getByText('12 → 17')).toBeInTheDocument();

    await chooseOption('Reason', 'Issue');
    expect(screen.getByText('12 → 7')).toBeInTheDocument();
    await chooseOption('Reason', 'Write Off');
    expect(screen.getByText('12 → 7')).toBeInTheDocument();
    await chooseOption('Reason', 'Return');
    expect(screen.getByText('12 → 17')).toBeInTheDocument();
    await chooseOption('Reason', 'Count');
    expect(screen.getByText('Stocktake: the level becomes 5.')).toBeInTheDocument();
  });

  it('reads a cleared quantity as nothing moving', async () => {
    renderForm();
    await chooseOption('Product', 'Widget — 12 in stock');

    setNumber('Quantity', '');

    expect(screen.getByText('12 → 12')).toBeInTheDocument();
  });

  it('requires a product and a whole quantity of at least one', async () => {
    renderForm();
    setNumber('Quantity', '0');

    await press('Record');

    expect(await screen.findByText('Choose a product')).toBeInTheDocument();
    expect(screen.getByText('Quantity must be at least 1')).toBeInTheDocument();

    setNumber('Quantity', '2.5');
    expect(await screen.findByText('Whole units only')).toBeInTheDocument();
    expect(gql.record).not.toHaveBeenCalled();
  });

  it('records the movement and reports the new level', async () => {
    const { onDone } = renderForm();
    await chooseOption('Product', 'Widget — 12 in stock');
    setNumber('Quantity', '4');
    await chooseOption('Supplier', 'ACME-01 — Acme Supplies');
    await fillField('Reference', ' PO-0001 ');

    await press('Record');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.record).toHaveBeenCalledWith({
      variables: {
        input: {
          productId: 'product-1',
          reason: MovementReason.Receipt,
          quantity: 4,
          supplierId: 'supplier-1',
          reference: 'PO-0001',
          notes: '',
        },
      },
    });
    expect(await screen.findByText('Recorded. Stock is now 16.')).toBeInTheDocument();
  });

  it('says a dash for the level when the server does not return one', async () => {
    gql.record.mockResolvedValueOnce({ data: undefined });
    const { onDone } = renderForm();
    await chooseOption('Product', 'Widget — 12 in stock');

    await press('Record');

    expect(await screen.findByText('Recorded. Stock is now —.')).toBeInTheDocument();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('keeps the form open and shows the server’s reason when recording fails', async () => {
    gql.record.mockRejectedValueOnce(new Error('Not enough stock to issue 4'));
    const { onDone } = renderForm();
    await chooseOption('Product', 'Widget — 12 in stock');

    await press('Record');

    expect(await screen.findByText('Not enough stock to issue 4')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('falls back to a generic message for a failure that is not an Error', async () => {
    gql.record.mockRejectedValueOnce('offline');
    renderForm();
    await chooseOption('Product', 'Widget — 12 in stock');

    await press('Record');

    expect(await screen.findByText('Could not record the movement')).toBeInTheDocument();
  });

  it('cancels without recording', async () => {
    const { onCancel } = renderForm();

    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(gql.record).not.toHaveBeenCalled();
  });
});
