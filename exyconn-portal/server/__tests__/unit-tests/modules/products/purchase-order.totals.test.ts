import {
  movingAverageCost,
  orderTax,
  round2,
  statusFromReceipts,
} from '../../../../src/modules/products/purchase-order.totals';

describe('purchase order arithmetic edges', () => {
  it('rounds money to two places', () => {
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(round2(1.236)).toBe(1.24);
    expect(round2(1.234)).toBe(1.23);
  });

  it('adds no tax to an order of tax-free lines', () => {
    expect(orderTax([{ quantity: 3, unitCost: 9.99, taxPercent: 0 }])).toBe(0);
  });

  it('reads a line with no receipt recorded as nothing received', () => {
    const lines = [
      { quantity: 4, unitCost: 1, taxPercent: 0 },
      { quantity: 2, unitCost: 1, taxPercent: 0, receivedQuantity: 2 },
    ];

    expect(statusFromReceipts([{ quantity: 4, unitCost: 1, taxPercent: 0 }], 'ORDERED')).toBe(
      'ORDERED',
    );
    expect(statusFromReceipts(lines, 'ORDERED')).toBe('PARTIALLY_RECEIVED');
  });

  it('takes the incoming cost, rounded, when there is nothing to average against', () => {
    // A negative shelf clamped to zero and an empty receipt leave no units to weigh.
    expect(movingAverageCost(-3, 50, 0, 7.126)).toBe(7.13);
    expect(movingAverageCost(0, 0, 0, 12)).toBe(12);
  });
});
