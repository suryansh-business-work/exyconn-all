import { ProductModel } from './products.model';
import { registerReminderSource, dayKey } from '../reminders';
import { ROLES } from '../../constants/roles';
import type { Reminder } from '../reminders';

/** How many lines the notice names before it starts counting instead. */
const NAMED = 5;

/**
 * Stock that has fallen to its reorder level.
 *
 * Every product has carried a `reorderLevel` since the catalogue was built, and the only
 * thing that ever read it was a tile on the Products overview — which tells whoever happens
 * to open that screen, on a day they happen to open it. Running out of something is a fact
 * about a date, not about who is looking.
 *
 * One notice a day for the whole list rather than one per product: a catalogue of a thousand
 * lines can easily have forty at their reorder level, and forty notifications every morning
 * is how a buyer learns to ignore the bell.
 */
registerReminderSource({
  key: 'products-low-stock',
  label: 'Stock at its reorder level',
  async due(now): Promise<Reminder[]> {
    const rows = await ProductModel.find({
      status: 'ACTIVE',
      reorderLevel: { $gt: 0 },
      $expr: { $lte: ['$stock', '$reorderLevel'] },
    })
      .sort({ stock: 1 })
      .select('name sku stock reorderLevel')
      .lean();
    if (rows.length === 0) {
      return [];
    }

    const named = rows
      .slice(0, NAMED)
      .map((row) => `${row.name} (${row.stock} left, reorder at ${row.reorderLevel})`)
      .join(', ');
    const rest = rows.length - Math.min(rows.length, NAMED);

    return [
      {
        dedupeKey: `products-low-stock:${dayKey(now)}`,
        kind: 'GENERAL',
        title: `${rows.length} product${rows.length === 1 ? '' : 's'} at the reorder level`,
        body: `${named}${rest > 0 ? ` and ${rest} more` : ''}. Raise a purchase order before they run out.`,
        link: '/products/catalogue',
        roles: [ROLES.PRODUCTS],
      },
    ];
  },
});
