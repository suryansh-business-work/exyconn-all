import { describe, expect, it } from 'vitest';
import type { SeedWorkflow } from '../../../src/author';
import { travel } from '../../../src/seeds/travel';
import { DOMESTIC, HONEYMOON, INTERNATIONAL, rupees } from '../../../src/seeds/travel/data';
import { checkSeed } from './check-seed';

function workflow(key: string): SeedWorkflow | undefined {
  return travel.workflows.find((w) => w.key === key);
}

describe('travel seed', () => {
  checkSeed(travel, ['enquiry', 'packages', 'consultation', 'itinerary']);

  it('formats rupee amounts with Indian digit grouping', () => {
    expect(rupees(0)).toBe('₹0');
    expect(rupees(999)).toBe('₹999');
    expect(rupees(125000)).toBe('₹1,25,000');
  });

  it('lists the hotel nights and rooms of the itinerary in stay order', () => {
    const doc = workflow('itinerary')?.nodes.find((n) => n.type === 'document');
    const sections = doc?.type === 'document' ? doc.data.document.preview.sections : [];
    const hotels = sections.find((s) => s.kind === 'table' && s.heading === 'Hotels');
    const rows = hotels?.kind === 'table' ? hotels.rows : [];
    expect(rows.map((r) => r.cells.slice(1, 3))).toEqual([
      ['2', 'Deluxe'],
      ['1', 'Deluxe'],
      ['1', 'Houseboat cabin'],
    ]);
  });

  it('carries each package into the flow with a 5% GST on its booking advance', () => {
    const groups = [
      ['c-domestic', DOMESTIC],
      ['c-international', INTERNATIONAL],
      ['c-honeymoon', HONEYMOON],
    ] as const;
    for (const [id, tours] of groups) {
      const node = workflow('packages')?.nodes.find((n) => n.id === id);
      const cards = node?.type === 'carousel' ? node.data.cards : [];
      expect(cards.map((c) => c.id)).toEqual(tours.map((t) => t.id));
      for (const [i, tour] of tours.entries()) {
        expect(cards[i].set).toMatchObject({
          pkgId: tour.id,
          advance: String(tour.advance),
          advanceGst: String(Math.round(tour.advance * 0.05)),
        });
      }
      expect(node?.next).toEqual(Object.fromEntries(tours.map((t) => [t.id, 'details'])));
    }
  });
});
