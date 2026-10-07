import { describe, expect, it } from 'vitest';
import { salon } from '../../../src/seeds/salon';
import { CATEGORIES, PRICE_GUIDE, STYLISTS } from '../../../src/seeds/salon/data';
import { checkSeed } from './check-seed';
import { SeedChat } from './play';

describe('salon seed', () => {
  checkSeed(salon, ['book', 'quick-book', 'packages', 'my-booking']);

  it('quotes the cheapest service of each category as its starting price', () => {
    expect(PRICE_GUIDE.map((p) => p.id)).toEqual(CATEGORIES.map((c) => c.key));
    for (const [i, guide] of PRICE_GUIDE.entries()) {
      const prices = CATEGORIES[i].services.map((s) => s.price);
      expect(prices).toContain(guide.from);
      expect(prices.every((price) => price >= guide.from)).toBe(true);
    }
  });

  it('shows the stylist premium only for stylists who charge one', () => {
    const book = salon.workflows.find((w) => w.key === 'book');
    const stylists = book?.nodes.find((n) => n.id === 'stylist');
    const rows = stylists?.type === 'list' ? stylists.data.sections.flatMap((s) => s.rows) : [];
    for (const stylist of STYLISTS) {
      const row = rows.find((r) => r.id === stylist.id);
      expect(row?.description?.includes('+₹'), stylist.id).toBe(stylist.premium > 0);
    }
    expect(STYLISTS.some((s) => s.premium === 0)).toBe(true);
  });

  it('opens the service menu of whichever category is picked, the first one included', () => {
    for (const category of CATEGORIES) {
      const chat = new SeedChat(salon);
      chat.open('book');
      chat.pick(category.key);
      expect(
        chat.options().map((o) => o.id),
        category.key,
      ).toEqual(category.services.map((s) => s.id));
      expect(chat.options().every((o) => o.ref.node === `svc-${category.key}`)).toBe(true);
    }
  });
});
