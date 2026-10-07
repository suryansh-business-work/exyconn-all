import { reminderSources, type ReminderSource } from '../../../../src/modules/reminders';
import { ProductModel } from '../../../../src/modules/products/products.model';
import { ROLES } from '../../../../src/constants/roles';
// Registering happens on import, the way the server does it.
import '../../../../src/modules/products/products.reminders';

const NOW = new Date('2026-09-20T09:00:00.000Z');

const source = (): ReminderSource => {
  const found = reminderSources().find((entry) => entry.key === 'products-low-stock');
  if (!found) {
    throw new Error('products-low-stock is not registered');
  }
  return found;
};

const product = (name: string, stock: number, reorderLevel: number, status = 'ACTIVE') =>
  ProductModel.create({
    name,
    sku: name.toUpperCase().replaceAll(' ', '-'),
    category: 'Hardware',
    status,
    price: 100,
    stock,
    reorderLevel,
  });

describe('the low-stock reminder source', () => {
  it('registers under a label the health screen can show', () => {
    expect(source().label).toBe('Stock at its reorder level');
  });

  it('has nothing to say while every line is above its reorder level', async () => {
    await product('Plenty', 50, 5);
    await product('Shelved', 0, 5, 'ARCHIVED');

    await expect(source().due(NOW)).resolves.toEqual([]);
  });

  it('names a single line in the singular, with no count of the rest', async () => {
    await product('Cable', 5, 5);

    const [notice] = await source().due(NOW);

    expect(notice).toEqual({
      dedupeKey: 'products-low-stock:2026-09-20',
      kind: 'GENERAL',
      title: '1 product at the reorder level',
      body: 'Cable (5 left, reorder at 5). Raise a purchase order before they run out.',
      link: '/products/catalogue',
      roles: [ROLES.PRODUCTS],
    });
  });

  it('names up to five lines, emptiest first, before it starts counting', async () => {
    const stocks = [4, 0, 3, 1, 2];
    for (const [index, stock] of stocks.entries()) {
      await product(`Part ${index}`, stock, 5);
    }

    const [first] = await source().due(NOW);
    expect(first.title).toBe('5 products at the reorder level');
    expect(first.body).not.toContain('more');
    expect(first.body.startsWith('Part 1 (0 left, reorder at 5), Part 3 (1 left')).toBe(true);

    await product('Part 5', 2, 3);
    const [second] = await source().due(NOW);
    expect(second.title).toBe('6 products at the reorder level');
    expect(second.body).toContain(' and 1 more. Raise a purchase order');
  });
});
