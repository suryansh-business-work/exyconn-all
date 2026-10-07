/**
 * The FitNation workflows read their current plan and yoga studio out of the catalogue by id.
 * When the catalogue loses that id, they fall back to its first entry instead of crashing.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AuthorNode } from '../../../src/author';

const DATA = '../../../src/seeds/fitness/data';

function nodeById(nodes: readonly AuthorNode[], id: string): AuthorNode | undefined {
  return nodes.find((n) => n.id === id);
}

afterEach(() => {
  vi.doUnmock(DATA);
  vi.resetModules();
});

describe('fitness catalogue lookups', () => {
  it('renews the current quarterly plan when the catalogue has it', async () => {
    const { membershipRenewal } = await import('../../../src/seeds/fitness/membership-renewal');
    const current = nodeById(membershipRenewal.nodes, 'current');
    expect(current?.type === 'image' && current.data.set).toMatchObject({ plan: 'Quarterly' });
  });

  it('renews the first plan when the current plan id is not in the catalogue', async () => {
    vi.resetModules();
    vi.doMock(DATA, async (importOriginal) => {
      const actual = await importOriginal<typeof import('../../../src/seeds/fitness/data')>();
      return { ...actual, CURRENT_PLAN: { ...actual.CURRENT_PLAN, id: 'retired-plan' } };
    });
    const { membershipRenewal } = await import('../../../src/seeds/fitness/membership-renewal');
    const { PLANS } = await import('../../../src/seeds/fitness/data');
    const current = nodeById(membershipRenewal.nodes, 'current');
    expect(current?.type === 'image' && current.data.set).toMatchObject({
      plan: PLANS[0].title,
      planPrice: String(PLANS[0].price),
    });
  });

  it('pins the Bandra studio for yoga when the catalogue has it', async () => {
    const { yoga } = await import('../../../src/seeds/fitness/yoga');
    const { BRANCHES } = await import('../../../src/seeds/fitness/data');
    const bandra = BRANCHES.find((b) => b.id === 'bandra');
    const pin = nodeById(yoga.nodes, 'pin');
    expect(pin?.type === 'location' && pin.data.location.name).toBe(bandra?.name);
  });

  it('pins the first branch for yoga when there is no Bandra studio', async () => {
    vi.resetModules();
    vi.doMock(DATA, async (importOriginal) => {
      const actual = await importOriginal<typeof import('../../../src/seeds/fitness/data')>();
      return { ...actual, BRANCHES: actual.BRANCHES.filter((b) => b.id !== 'bandra') };
    });
    const { yoga } = await import('../../../src/seeds/fitness/yoga');
    const { BRANCHES } = await import('../../../src/seeds/fitness/data');
    const pin = nodeById(yoga.nodes, 'pin');
    expect(pin?.type === 'location' && pin.data.location).toEqual({
      name: BRANCHES[0].name,
      address: BRANCHES[0].address,
      lat: BRANCHES[0].lat,
      lng: BRANCHES[0].lng,
    });
  });
});
