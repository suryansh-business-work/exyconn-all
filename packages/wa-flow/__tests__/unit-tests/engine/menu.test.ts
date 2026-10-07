import { describe, expect, it } from 'vitest';
import { isMenuWord, matchKeywords, MENU, menuMessage, normalise } from '../../../src/engine/menu';
import { scopeOf } from '../../../src/engine/template';
import { makeBundle, makeCtx, makeWorkflow } from './fixtures';

const end = [{ id: 'e', type: 'end' as const, data: { showMenu: true } }];
const bundle = makeBundle([
  makeWorkflow('book', end, { keywords: ['book', 'appointment'] }),
  makeWorkflow('track', end, { keywords: ['track order'] }),
]);

describe('normalise', () => {
  it('lower-cases, strips punctuation and pads with single spaces', () => {
    expect(normalise('  Hello,   WORLD!! ')).toBe(' hello world ');
    expect(normalise('Café #2')).toBe(' café 2 ');
  });
});

describe('isMenuWord', () => {
  it('recognises menu words whatever their case or punctuation', () => {
    expect(isMenuWord('Hi!')).toBe(true);
    expect(isMenuWord('MAIN   menu')).toBe(true);
    expect(isMenuWord('hi there')).toBe(false);
  });
});

describe('matchKeywords', () => {
  it('finds the workflow by whole word or phrase', () => {
    expect(matchKeywords(bundle, 'I want to BOOK a visit')).toBe('book');
    expect(matchKeywords(bundle, 'please track order #12')).toBe('track');
  });

  it('does not match inside another word', () => {
    expect(matchKeywords(bundle, 'my notebook is lost')).toBeUndefined();
    expect(matchKeywords(bundle, 'track')).toBeUndefined();
  });
});

describe('menuMessage', () => {
  it('lists one row per workflow leading to the menu ref, translated', () => {
    const ctx = makeCtx({ t: (s) => `[${s}]` });
    const message = menuMessage(bundle, scopeOf({}, ctx), ctx);
    expect(message).toMatchObject({
      type: 'list',
      text: '[Pick one]',
      button: '[Options]',
      footer: '[Type menu at any time to come back here]',
    });
    if (message.type !== 'list') {
      throw new Error('expected a list');
    }
    expect(message.sections[0].title).toBe('[Services]');
    expect(message.sections[0].rows).toEqual([
      {
        id: 'book',
        title: '[book name]',
        description: '[book description]',
        ref: { workflow: MENU, node: MENU, handle: 'book' },
      },
      {
        id: 'track',
        title: '[track name]',
        description: '[track description]',
        ref: { workflow: MENU, node: MENU, handle: 'track' },
      },
    ]);
  });
});
