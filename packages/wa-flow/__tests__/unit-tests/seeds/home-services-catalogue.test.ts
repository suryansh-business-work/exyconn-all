/**
 * HomeEase's catalogue helpers and the AI flow's quick fixes: each free-text intent maps to a
 * category and a starter service, falling back to the category's first service when the
 * starter id is gone.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AuthorNode } from '../../../src/author';
import {
  CATEGORIES,
  categoryOf,
  QUICK_FIXES,
  rupees,
  serviceVars,
} from '../../../src/seeds/home-services/data';
import { slotPicker } from '../../../src/seeds/home-services/shared';

const DATA = '../../../src/seeds/home-services/data';

function fixSet(
  nodes: readonly AuthorNode[],
  intent: string,
): Readonly<Record<string, string>> | undefined {
  const node = nodes.find((n) => n.id === `fix-${intent}`);
  return node?.type === 'delay' ? node.data.set : undefined;
}

afterEach(() => {
  vi.doUnmock(DATA);
  vi.resetModules();
});

describe('home-services catalogue', () => {
  it('formats rupees with Indian digit grouping', () => {
    expect(rupees(1200)).toBe('₹1,200');
    expect(rupees(125000)).toBe('₹1,25,000');
    expect(rupees(0)).toBe('₹0');
  });

  it('finds a category by key and rejects an unknown one', () => {
    expect(categoryOf('plumbing').name).toBe('Plumbing');
    expect(() => categoryOf('gardening')).toThrow('Unknown home-services category gardening');
  });

  it('stores the service, its price and the category technician as text variables', () => {
    const category = categoryOf('plumbing');
    const [service] = category.services;
    expect(serviceVars(category, service)).toEqual({
      category: 'Plumbing',
      categoryKey: 'plumbing',
      service: service.title,
      servicePrice: String(service.price),
      serviceMrp: String(service.mrp),
      duration: service.duration,
      warranty: service.warranty,
      techName: category.technician.name,
      techPhone: category.technician.phone,
      techRating: category.technician.rating,
      techJobs: String(category.technician.jobs),
      techYears: String(category.technician.years),
    });
  });

  it('builds a day list and a slot list that can go back to the day list', () => {
    const [day, slot] = slotPicker({
      prefix: 'r-',
      next: 'review',
      dayText: 'Day?',
      slotText: 'Time?',
    });
    expect(day.id).toBe('r-day');
    expect(day.next).toEqual({ pick: 'r-slot' });
    expect(slot.id).toBe('r-slot');
    expect(slot.next).toEqual({ pick: 'review', 'other-day': 'r-day' });
    expect(slot.type === 'list' && slot.data.dynamic).toMatchObject({
      kind: 'slots',
      dayVar: 'day',
      from: 8,
      to: 20,
    });
  });

  it('maps every quick fix to its starter service', async () => {
    const { describeProblem } = await import('../../../src/seeds/home-services/describe-problem');
    for (const fix of QUICK_FIXES) {
      const category = CATEGORIES.find((c) => c.key === fix.categoryKey);
      const service = category?.services.find((s) => s.id === fix.serviceId);
      expect(fixSet(describeProblem.nodes, fix.intent), fix.intent).toMatchObject({
        service: service?.title,
      });
    }
  });

  it('falls back to the category first service when a starter service is gone', async () => {
    vi.resetModules();
    vi.doMock(DATA, async (importOriginal) => {
      const actual = await importOriginal<typeof import('../../../src/seeds/home-services/data')>();
      return {
        ...actual,
        QUICK_FIXES: actual.QUICK_FIXES.map((f) => ({ ...f, serviceId: 'discontinued' })),
      };
    });
    const { describeProblem } = await import('../../../src/seeds/home-services/describe-problem');
    for (const fix of QUICK_FIXES) {
      const first = categoryOf(fix.categoryKey).services[0];
      expect(fixSet(describeProblem.nodes, fix.intent), fix.intent).toMatchObject({
        service: first.title,
      });
    }
  });
});
