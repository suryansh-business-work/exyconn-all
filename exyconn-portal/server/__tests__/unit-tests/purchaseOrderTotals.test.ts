import {
  lineCost,
  movingAverageCost,
  orderSubtotal,
  orderTax,
  orderTotal,
  statusFromReceipts,
} from '../../src/modules/products/purchase-order.totals';

const line = (quantity: number, unitCost: number, taxPercent = 0, receivedQuantity = 0) => ({
  quantity,
  unitCost,
  taxPercent,
  receivedQuantity,
});

describe('purchase order totals', () => {
  it('costs a line with its tax', () => {
    expect(lineCost(line(10, 100, 18))).toBe(1180);
  });

  it('splits an order into subtotal, tax and total', () => {
    const lines = [line(10, 100, 18), line(2, 50, 0)];

    expect(orderSubtotal(lines)).toBe(1100);
    expect(orderTax(lines)).toBe(180);
    expect(orderTotal(lines)).toBe(1280);
  });

  it('rounds to two places rather than carrying a floating-point tail', () => {
    expect(lineCost(line(3, 0.1))).toBe(0.3);
  });

  it('has nothing to total on an empty order', () => {
    expect(orderTotal([])).toBe(0);
  });
});

describe('statusFromReceipts', () => {
  it('is ORDERED while nothing has arrived', () => {
    expect(statusFromReceipts([line(10, 5, 0, 0)], 'ORDERED')).toBe('ORDERED');
  });

  it('is PARTIALLY_RECEIVED once some of it has', () => {
    expect(statusFromReceipts([line(10, 5, 0, 4)], 'ORDERED')).toBe('PARTIALLY_RECEIVED');
  });

  it('is RECEIVED when every line is complete', () => {
    expect(statusFromReceipts([line(10, 5, 0, 10), line(2, 1, 0, 2)], 'ORDERED')).toBe('RECEIVED');
  });

  it('counts an over-receipt as complete rather than stalling at partial', () => {
    expect(statusFromReceipts([line(10, 5, 0, 11)], 'PARTIALLY_RECEIVED')).toBe('RECEIVED');
  });

  it('leaves a cancelled or draft order where it is — those are decisions, not counts', () => {
    expect(statusFromReceipts([line(10, 5, 0, 10)], 'CANCELLED')).toBe('CANCELLED');
    expect(statusFromReceipts([line(10, 5, 0, 0)], 'DRAFT')).toBe('DRAFT');
  });
});

describe('movingAverageCost', () => {
  it('weights the existing shelf against what arrived', () => {
    // 10 at 100 plus 10 at 200 is 150 each, not 200.
    expect(movingAverageCost(10, 100, 10, 200)).toBe(150);
  });

  it('takes the incoming cost when there was nothing on the shelf', () => {
    expect(movingAverageCost(0, 0, 5, 42)).toBe(42);
  });

  it('does not let a negative stock level distort the average', () => {
    expect(movingAverageCost(-5, 100, 10, 200)).toBe(200);
  });

  it('rounds the average to two places', () => {
    expect(movingAverageCost(3, 10, 1, 12)).toBe(10.5);
  });
});
