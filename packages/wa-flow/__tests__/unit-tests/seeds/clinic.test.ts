import { describe, expect, it } from 'vitest';
import { clinic } from '../../../src/seeds/clinic';
import { patientNodes, slotPicker } from '../../../src/seeds/clinic/shared';
import { checkSeed } from './check-seed';

describe('clinic seed', () => {
  checkSeed(clinic, ['skin-consult', 'dental', 'aesthetic', 'aftercare']);

  it('wires the slot picker back to the day list for "Pick another day"', () => {
    const [day, slot] = slotPicker({
      day: 'd',
      slot: 's',
      next: 'n',
      dayText: 'Day?',
      slotText: 'Time?',
      stepMin: 20,
    });
    expect(day.next).toEqual({ pick: 's' });
    expect(slot.next).toEqual({ pick: 'n', 'other-day': 'd' });
  });

  it('names the visit in the "who is it for" question and ends every path at review', () => {
    const nodes = patientNodes('review', 'consultation');
    expect(nodes[0].type === 'buttons' && nodes[0].data.text).toContain(
      'Who is the consultation for?',
    );
    expect(nodes.filter((n) => JSON.stringify(n.next).includes('review')).map((n) => n.id)).toEqual(
      ['own-phone', 'ask-phone', 'p-ok'],
    );
  });
});
