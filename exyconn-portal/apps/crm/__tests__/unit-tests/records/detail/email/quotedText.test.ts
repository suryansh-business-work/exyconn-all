import { describe, expect, it } from 'vitest';
import { splitQuoted } from '../../../../../src/records/detail/email/quotedText';

describe('splitQuoted', () => {
  it('folds the Gmail attribution and the quoted mail away from the reply', () => {
    const text = [
      'I accept the offer.',
      '',
      'On Fri, 18 Sep 2026 at 2:30 PM, Nancy <hr@exyconn.com> wrote:',
      '',
      '> Dear Shaivya,',
      '> Welcome aboard.',
    ].join('\n');

    expect(splitQuoted(text)).toEqual({
      main: 'I accept the offer.',
      quoted: text.split('\n').slice(2).join('\n'),
    });
  });

  it('keeps an attribution Gmail wrapped over two lines with the quote', () => {
    const text = 'Thanks!\nOn Fri, 18 Sep 2026, Nancy Malhotra\n<hr@exyconn.com> wrote:\n> Hello';

    expect(splitQuoted(text)).toEqual({
      main: 'Thanks!',
      quoted: 'On Fri, 18 Sep 2026, Nancy Malhotra\n<hr@exyconn.com> wrote:\n> Hello',
    });
  });

  it("starts the quote at Outlook's original-message marker", () => {
    expect(splitQuoted('Sounds good\n-----Original Message-----\nFrom: a@b.c')).toEqual({
      main: 'Sounds good',
      quoted: '-----Original Message-----\nFrom: a@b.c',
    });
  });

  it('leaves a message with no quote, or one that is only quote, whole', () => {
    expect(splitQuoted('Just a note')).toEqual({ main: 'Just a note', quoted: '' });
    expect(splitQuoted('> all quoted')).toEqual({ main: '> all quoted', quoted: '' });
    expect(splitQuoted('Hi\n\n> quoted')).toEqual({ main: 'Hi', quoted: '> quoted' });
  });
});
