import { describe, expect, it } from 'vitest';
import { coworking } from '../../../src/seeds/coworking';
import { CENTRES, centreSections, gst } from '../../../src/seeds/coworking/data';
import { centrePins } from '../../../src/seeds/coworking/pins';
import { checkSeed } from './check-seed';

describe('coworking seed', () => {
  checkSeed(coworking, ['tour', 'meeting-room', 'day-pass', 'membership']);

  it('adds 18% GST rounded to the rupee', () => {
    expect(gst(1000)).toBe(180);
    expect(gst(499)).toBe(90);
  });

  it('groups centres by city, adding any extra variables per centre', () => {
    const plain = centreSections();
    expect(plain.flatMap((s) => s.rows).map((r) => r.id)).toEqual(
      expect.arrayContaining(CENTRES.map((c) => c.id)),
    );
    const extra = centreSections((c) => ({ pass: String(c.dayPass) }));
    expect(extra[0].rows[0].set).toMatchObject({ pass: expect.stringMatching(/^\d+$/) });
  });

  it('routes to the first centre pin when no other centre matches', () => {
    const [route, ...pins] = centrePins('pin', 'Here', 'after');
    expect(route.next).toMatchObject({ else: `pin-${CENTRES[0].id}` });
    expect(pins).toHaveLength(CENTRES.length);
    expect(pins.every((p) => p.next === 'after')).toBe(true);
  });
});
