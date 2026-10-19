import { describe, expect, it } from 'vitest';
import { dialable, emailsOf, phonesOf } from '../../../../src/records/comms/recordChannels';

describe('recordChannels', () => {
  it('strips the spaces, dashes, dots and brackets people type in numbers', () => {
    expect(dialable('+1 (415) 555-0100')).toBe('+14155550100');
    expect(dialable('020.7946.0958')).toBe('02079460958');
  });

  it('lists the main number first, then the others, trimmed and without repeats or blanks', () => {
    expect(
      phonesOf({
        phone: ' +14155550100 ',
        phones: [{ number: '+14155550100' }, { number: '  ' }, { number: '+442079460958' }],
      }),
    ).toEqual(['+14155550100', '+442079460958']);
  });

  it('copes with a record that has no numbers at all', () => {
    expect(phonesOf({})).toEqual([]);
    expect(phonesOf({ phone: null, phones: null })).toEqual([]);
  });

  it('lists every address, the main one first, without repeats', () => {
    expect(
      emailsOf({
        email: 'ada@example.com',
        emails: [{ address: 'ada@example.com' }, { address: 'ada@work.example' }],
      }),
    ).toEqual(['ada@example.com', 'ada@work.example']);
    expect(emailsOf({ email: '', emails: null })).toEqual([]);
  });
});
