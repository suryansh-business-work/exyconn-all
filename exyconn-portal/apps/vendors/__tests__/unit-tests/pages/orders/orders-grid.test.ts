import { describe, expect, it } from 'vitest';
import { PurchaseOrderStatus } from '@exyconn/shell/graphql/generated';
import { ORDER_COLUMNS, canAcknowledge } from '../../../../src/pages/orders/orders-grid';
import { actionSpecs, columnIds, formatCell, isActionHidden } from '../../grid-helpers';
import { orderRow } from '../fixtures';

describe('ORDER_COLUMNS', () => {
  it('lists what was ordered, by when, and whether it is confirmed', () => {
    expect(columnIds(ORDER_COLUMNS)).toEqual([
      'number',
      'orderDate',
      'expectedDate',
      'items',
      'total',
      'status',
      'acknowledgedAt',
      'actions',
    ]);
  });

  it('sums up the lines as quantity × product', () => {
    expect(formatCell(ORDER_COLUMNS, 'items', orderRow())).toBe('3 × Paper, 1 × Toner');
    expect(formatCell(ORDER_COLUMNS, 'items', orderRow({ lines: [] }))).toBe('');
  });

  it("writes the total in the order's own currency", () => {
    expect(formatCell(ORDER_COLUMNS, 'total', orderRow({ total: 99, currency: 'EUR' }))).toBe(
      '€99.00',
    );
  });

  it('offers acknowledge and invoice as the row actions', () => {
    expect(actionSpecs(ORDER_COLUMNS).map((action) => action.key)).toEqual([
      'acknowledge',
      'invoice',
    ]);
  });
});

describe('canAcknowledge', () => {
  it('is true only for an open order nobody has confirmed', () => {
    expect(canAcknowledge(orderRow())).toBe(true);
    expect(canAcknowledge(orderRow({ acknowledgedAt: '2026-10-02T00:00:00.000Z' }))).toBe(false);
    expect(canAcknowledge(orderRow({ status: PurchaseOrderStatus.Received }))).toBe(false);
    expect(canAcknowledge(orderRow({ status: PurchaseOrderStatus.Cancelled }))).toBe(false);
  });

  it('hides the acknowledge action wherever it cannot be done', () => {
    expect(isActionHidden(ORDER_COLUMNS, 'acknowledge', orderRow())).toBe(false);
    expect(
      isActionHidden(
        ORDER_COLUMNS,
        'acknowledge',
        orderRow({ acknowledgedAt: '2026-10-02T00:00:00.000Z' }),
      ),
    ).toBe(true);
  });
});

describe('the invoice action', () => {
  it('is offered on any order except a cancelled one', () => {
    expect(isActionHidden(ORDER_COLUMNS, 'invoice', orderRow())).toBe(false);
    expect(
      isActionHidden(
        ORDER_COLUMNS,
        'invoice',
        orderRow({ status: PurchaseOrderStatus.PartiallyReceived }),
      ),
    ).toBe(false);
    expect(
      isActionHidden(ORDER_COLUMNS, 'invoice', orderRow({ status: PurchaseOrderStatus.Cancelled })),
    ).toBe(true);
  });
});
