import { describe, expect, it } from 'vitest';
import { color } from '@exyconn/ui';
import { hasContent, inlineFrom, parseInlines } from '../../../src/export/parse-inline';

const element = (html: string): HTMLElement => {
  const host = document.createElement('div');
  host.innerHTML = html;
  return host;
};

describe('parseInlines', () => {
  it('carries every tag mark onto the text inside it', () => {
    const runs = parseInlines(
      element(
        '<strong>a</strong><b>b</b><em>c</em><i>d</i><u>e</u><s>f</s><strike>g</strike><del>h</del><code>i</code><sub>j</sub><sup>k</sup>',
      ),
    );
    expect(runs).toEqual([
      { kind: 'text', text: 'a', bold: true },
      { kind: 'text', text: 'b', bold: true },
      { kind: 'text', text: 'c', italic: true },
      { kind: 'text', text: 'd', italic: true },
      { kind: 'text', text: 'e', underline: true },
      { kind: 'text', text: 'f', strike: true },
      { kind: 'text', text: 'g', strike: true },
      { kind: 'text', text: 'h', strike: true },
      { kind: 'text', text: 'i', code: true },
      { kind: 'text', text: 'j', sub: true },
      { kind: 'text', text: 'k', sup: true },
    ]);
  });

  it('nests marks and reads links, colours, sizes and faces from inline styles', () => {
    const runs = parseInlines(
      element(
        '<a href="https://exyconn.com"><strong><span style="color: rgb(21, 93, 252); font-size: 18px; font-family: Georgia, serif">x</span></strong></a>',
      ),
    );
    expect(runs).toEqual([
      {
        kind: 'text',
        text: 'x',
        link: 'https://exyconn.com',
        bold: true,
        color: '#155dfc',
        fontSize: 18,
        fontFamily: 'Georgia',
      },
    ]);
  });

  it('leaves a link without an address unlinked, and ignores unknown styles', () => {
    const runs = parseInlines(
      element('<a>bare</a><span style="color: red; font-size: 2em">y</span>'),
    );
    expect(runs).toEqual([
      { kind: 'text', text: 'bare', link: undefined },
      { kind: 'text', text: 'y' },
    ]);
  });

  it('reads a highlight from data-color, then the background, then the default', () => {
    const runs = parseInlines(
      element(
        '<mark data-color="#ffd166">a</mark><mark style="background-color: rgb(1, 2, 3)">b</mark><mark>c</mark>',
      ),
    );
    expect(runs.map((run) => run.kind === 'text' && run.highlight)).toEqual([
      '#ffd166',
      '#010203',
      color.amber[200],
    ]);
  });

  it('turns <br> into a line break and skips comments', () => {
    expect(parseInlines(element('a<br><!-- note -->b'))).toEqual([
      { kind: 'text', text: 'a' },
      { kind: 'break' },
      { kind: 'text', text: 'b' },
    ]);
  });
});

describe('inlineFrom', () => {
  it('drops empty text nodes and text nodes without content', () => {
    expect(inlineFrom(document.createTextNode(''), { bold: true })).toEqual([]);
    const detached = { nodeType: Node.TEXT_NODE, textContent: null } as unknown as Node;
    expect(inlineFrom(detached, {})).toEqual([]);
  });

  it('keeps the marks passed in from outside', () => {
    expect(inlineFrom(document.createTextNode('t'), { italic: true })).toEqual([
      { kind: 'text', text: 't', italic: true },
    ]);
  });
});

describe('hasContent', () => {
  it('counts visible text and line breaks, not whitespace', () => {
    expect(hasContent([])).toBe(false);
    expect(hasContent([{ kind: 'text', text: '  \n ' }])).toBe(false);
    expect(hasContent([{ kind: 'text', text: ' ' }, { kind: 'break' }])).toBe(true);
    expect(hasContent([{ kind: 'text', text: 'x' }])).toBe(true);
  });
});
