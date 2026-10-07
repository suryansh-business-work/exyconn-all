import { describe, expect, it } from 'vitest';
import { chosen } from '../../../src/seeds/clinic/aesthetic';
import { PROCEDURES, TREATMENTS } from '../../../src/seeds/clinic/data';

const hydrafacial = TREATMENTS[0];

describe('aesthetic treatment choice', () => {
  it('stores the treatment with its aftercare notes', () => {
    const care = PROCEDURES.find((p) => p.id === hydrafacial.aftercare);
    expect(chosen(hydrafacial)).toMatchObject({
      treatment: hydrafacial.title,
      price: String(hydrafacial.price),
      hasPackage: 'yes',
      procedure: care?.title,
      procKey: 'hydrafacial',
      normal: care?.normal,
      aftercare: care?.aftercare,
    });
  });

  it('marks consult-only treatments as having no package', () => {
    const consultOnly = TREATMENTS.find((t) => t.packagePrice === 0);
    expect(consultOnly && chosen(consultOnly).hasPackage).toBe('no');
  });

  it('falls back to the treatment title and empty notes without an aftercare plan', () => {
    const unplanned = { ...hydrafacial, aftercare: 'none' };
    expect(chosen(unplanned)).toMatchObject({
      procedure: hydrafacial.title,
      procKey: 'none',
      normal: '',
      aftercare: '',
    });
  });
});
