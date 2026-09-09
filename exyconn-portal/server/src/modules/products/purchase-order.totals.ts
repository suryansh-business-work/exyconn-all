/** One ordered line as the arithmetic reads it. */
export interface PurchaseLineShape {
  quantity: number;
  unitCost: number;
  taxPercent: number;
  receivedQuantity?: number;
}

/** Money to two places, so a total never carries a floating-point tail. */
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** What one line costs, tax included. */
export function lineCost(line: PurchaseLineShape): number {
  return round2(line.quantity * line.unitCost * (1 + line.taxPercent / 100));
}

/** What the order costs before tax. */
export function orderSubtotal(lines: readonly PurchaseLineShape[]): number {
  return round2(lines.reduce((total, line) => total + line.quantity * line.unitCost, 0));
}

/** What the order costs, tax included. */
export function orderTotal(lines: readonly PurchaseLineShape[]): number {
  return round2(lines.reduce((total, line) => total + lineCost(line), 0));
}

/** The tax the order adds. */
export function orderTax(lines: readonly PurchaseLineShape[]): number {
  return round2(orderTotal(lines) - orderSubtotal(lines));
}

/**
 * Where an order stands, decided by what has actually arrived rather than by anybody's
 * opinion. A cancelled order keeps its status — cancelling is a decision, not a count.
 */
export function statusFromReceipts(lines: readonly PurchaseLineShape[], current: string): string {
  if (current === 'CANCELLED' || current === 'DRAFT') {
    return current;
  }
  const received = lines.reduce((total, line) => total + (line.receivedQuantity ?? 0), 0);
  const ordered = lines.reduce((total, line) => total + line.quantity, 0);
  if (received === 0) {
    return 'ORDERED';
  }
  return received >= ordered ? 'RECEIVED' : 'PARTIALLY_RECEIVED';
}

/**
 * The product's new average cost after receiving more of it.
 *
 * A weighted average, not "the latest price": valuing a shelf of stock bought at three
 * different prices at whichever arrived last would make inventory value jump on a receipt
 * that changed nothing about what is on the shelf. Falls back to the incoming cost when
 * there was no stock to average against.
 */
export function movingAverageCost(
  currentStock: number,
  currentAverage: number,
  incomingQuantity: number,
  incomingCost: number,
): number {
  // Clamp ONCE and use it on both sides. Clamping only the numerator divides the incoming
  // value by a smaller shelf than it was averaged against, and inflates the cost instead of
  // ignoring the impossible level.
  const onShelf = Math.max(currentStock, 0);
  const total = onShelf + incomingQuantity;
  if (total <= 0) {
    return round2(incomingCost);
  }
  return round2((onShelf * currentAverage + incomingQuantity * incomingCost) / total);
}
