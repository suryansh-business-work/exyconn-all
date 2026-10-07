import { describe, expect, it } from 'vitest';
import {
  lineCost,
  linesTotal,
} from '../../../../../../src/pages/purchase-orders/forms/purchase-order';

const line = (quantity: number, unitCost: number, taxPercent: number) => ({
  productId: 'product-1',
  quantity,
  unitCost,
  taxPercent,
});

describe('lineCost', () => {
  it('multiplies quantity by unit cost and adds the tax', () => {
    expect(lineCost(line(3, 10, 18))).toBe(35.4);
    expect(lineCost(line(4, 25, 0))).toBe(100);
  });

  it('rounds to the cent the way the server totals it', () => {
    expect(lineCost(line(2, 9.999, 0))).toBe(20);
    expect(lineCost(line(1, 0.333, 5))).toBe(0.35);
  });

  it('costs nothing for a free line', () => {
    expect(lineCost(line(5, 0, 18))).toBe(0);
  });
});

describe('linesTotal', () => {
  it('adds every line, tax included', () => {
    expect(linesTotal([line(3, 10, 18), line(1, 64.6, 0)])).toBe(100);
  });

  it('is zero for an order with no lines', () => {
    expect(linesTotal([])).toBe(0);
  });
});
