import { afterEach, describe, expect, it } from 'vitest';
import grapesjs, { type Editor } from 'grapesjs';
import { ARTICLE_BLOCKS } from '../../src/blocks';
import { readDesign } from '../../src/useGrapesEditor';

let editor: Editor | null = null;

const load = (html: string, css = ''): Editor => {
  const container = document.createElement('div');
  document.body.append(container);
  editor = grapesjs.init({
    container,
    headless: true,
    storageManager: false,
    components: html,
    style: css,
    selectorManager: { componentFirst: true },
  });
  return editor;
};

afterEach(() => {
  editor?.destroy();
  editor = null;
  document.body.innerHTML = '';
});

describe('readDesign', () => {
  it('returns a rich-text body unchanged, with no CSS', () => {
    const html = '<h2>Plan</h2><p>Body with <strong>bold</strong> text.</p>';
    const design = readDesign(load(html));
    expect(design.html).toBe(html);
    expect(design.css).toBe('');
  });

  it('moves inline styles into id rules, leaving the protected base CSS out', () => {
    const design = readDesign(load('<p style="color:red">Red</p>'));
    const id = /<p id="([\w-]+)">Red<\/p>/.exec(design.html)?.[1];
    expect(id).toBeTruthy();
    expect(design.css).toContain(`#${id}{color:red;}`);
    expect(design.css).not.toContain('box-sizing');
  });

  it('round-trips a stored design', () => {
    const first = readDesign(load('<div style="padding:16px"><p>Callout</p></div>'));
    editor?.destroy();
    const second = readDesign(load(first.html, first.css));
    // The same component keeps the same id; the CSS parser may add equivalent longhands.
    expect(second.html).toBe(first.html);
    const id = /id="([\w-]+)"/.exec(first.html)?.[1];
    expect(second.css).toMatch(new RegExp(String.raw`^#${id}\{[^}]*padding:16px;[^}]*\}$`));
  });
});

describe('ARTICLE_BLOCKS', () => {
  it('have unique ids and an icon each', () => {
    const ids = ARTICLE_BLOCKS.map((block) => block.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const block of ARTICLE_BLOCKS) {
      expect(block.media).toContain('<svg');
    }
  });

  it('never use markup the website strips (scripts, iframes, embeds)', () => {
    for (const block of ARTICLE_BLOCKS) {
      expect(JSON.stringify(block.content)).not.toMatch(/<(script|iframe|object|embed|style)/i);
    }
  });
});
