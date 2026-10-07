import { describe, expect, it, vi } from 'vitest';
import { PURCHASE_ORDER_COLUMNS } from '../../../../src/pages/purchase-orders/purchase-orders-grid';
import { orderLine, purchaseOrderRow } from '../../fixtures';
import { actionSpecs, columnIds, formatCell } from '../../grid-helpers';

describe('PURCHASE_ORDER_COLUMNS', () => {
  it('lists the order register columns, with the actions last', () => {
    expect(columnIds(PURCHASE_ORDER_COLUMNS)).toEqual([
      'number',
      'supplierName',
      'total',
      'lines',
      'status',
      'orderDate',
      'expectedDate',
      'actions',
    ]);
  });

  it('names the supplier, falling back to its id when the name is missing', () => {
    expect(formatCell(PURCHASE_ORDER_COLUMNS, 'supplierName', purchaseOrderRow())).toBe(
      'Acme Supplies',
    );
    expect(
      formatCell(
        PURCHASE_ORDER_COLUMNS,
        'supplierName',
        purchaseOrderRow({ supplierName: '', supplierId: 'supplier-9' }),
      ),
    ).toBe('supplier-9');
  });

  it('writes the total in the order currency', () => {
    const row = purchaseOrderRow({ currency: 'USD', total: 1234.5 });

    expect(formatCell(PURCHASE_ORDER_COLUMNS, 'total', row)).toBe(
      `USD ${(1234.5).toLocaleString()}`,
    );
  });

  it('adds up what has arrived against what was ordered across the lines', () => {
    const row = purchaseOrderRow({
      lines: [
        orderLine({ quantity: 10, receivedQuantity: 4 }),
        orderLine({ productId: 'product-2', quantity: 5, receivedQuantity: 5 }),
      ],
    });

    expect(formatCell(PURCHASE_ORDER_COLUMNS, 'lines', row)).toBe('9 / 15');
    expect(formatCell(PURCHASE_ORDER_COLUMNS, 'lines', purchaseOrderRow({ lines: [] }))).toBe(
      '0 / 0',
    );
  });

  it('dates the order and says a dash when nobody gave an expected date', () => {
    const formatDate = vi.fn(() => '04 Mar 2026');
    const row = purchaseOrderRow();

    expect(
      formatCell(PURCHASE_ORDER_COLUMNS, 'orderDate', row, {
        value: row.orderDate,
        context: { formatDate },
      }),
    ).toBe('04 Mar 2026');
    expect(
      formatCell(PURCHASE_ORDER_COLUMNS, 'expectedDate', row, {
        value: null,
        context: { formatDate },
      }),
    ).toBe('—');
  });

  it('offers book stock in, edit and delete, in that order', () => {
    const specs = actionSpecs(PURCHASE_ORDER_COLUMNS);

    expect(specs.map((spec) => spec.key)).toEqual(['receive', 'edit', 'delete']);
    expect(specs[0]).toMatchObject({ label: 'book stock in', color: 'primary' });
  });
});
