import { describe, expect, it, vi } from 'vitest';
import {
  WEBSITE_FONT_STYLESHEET,
  canvasCss,
  canvasStylesheets,
} from '../../../../../src/pages/cms/builder/canvas-css';

vi.mock('@exyconn/live-editor', () => ({ PLACEHOLDER_CSS: '.cms-placeholder { outline: 1px; }' }));

const TOKENS = {
  colors: { light: { fg: '#111' } },
  fontSources: [
    { provider: 'GOOGLE', family: 'Lora', variants: ['400'] },
    {
      provider: 'CUSTOM',
      family: 'Brand',
      files: [{ url: 'https://cdn/brand.woff2', weight: '400', format: 'woff2' }],
    },
  ],
};

describe('canvasCss', () => {
  it('stacks the font faces, tokens, page base, extra CSS, global CSS and placeholders', () => {
    const css = canvasCss({ tokens: TOKENS, extraCss: '.extra {}', globalCss: '.global {}' });
    const order = [
      '@font-face { font-family: "Brand"',
      ':root {\n  --color-fg: #111;\n}',
      'font-family: var(--font-family-sans, "Inter Tight", sans-serif);',
      'img { max-width: 100%; height: auto; }',
      '.extra {}',
      '.global {}',
      '.cms-placeholder { outline: 1px; }',
    ].map((part) => css.indexOf(part));

    expect(order.every((index) => index >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('still writes the page base for a site without a design system', () => {
    const css = canvasCss({ tokens: {}, extraCss: '', globalCss: '' });

    expect(css.startsWith('\n:root {')).toBe(true);
    expect(css).toContain('background-color: var(--color-page);');
  });
});

describe('canvasStylesheets', () => {
  it("loads the website's face and the design system's Google families", () => {
    expect(canvasStylesheets(TOKENS)).toEqual([
      WEBSITE_FONT_STYLESHEET,
      'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400&display=swap',
    ]);
  });

  it("loads only the website's face when there are no Google families", () => {
    expect(canvasStylesheets(null)).toEqual([WEBSITE_FONT_STYLESHEET]);
    expect(WEBSITE_FONT_STYLESHEET).toContain('family=Inter+Tight');
  });
});
