import { describe, expect, it } from 'vitest';
import { cmsBlocks } from '../../../src/cms/cms-blocks';
import { PAGE_BLOCKS } from '../../../src/cms/page-blocks';
import { PLACEHOLDER_CSS } from '../../../src/cms/canvas-css';
import type { CmsCatalogueEntry } from '../../../src/cms/cms.types';

const hero: CmsCatalogueEntry = {
  key: 'hero',
  label: 'Hero',
  category: 'Marketing',
  description: 'Big banner',
  defaultProps: { title: 'Welcome' },
  acceptsChildren: false,
};

describe('cmsBlocks', () => {
  it('starts with the page blocks when there is no catalogue or fragment', () => {
    expect(cmsBlocks([], [])).toEqual(PAGE_BLOCKS);
  });

  it('adds one block per catalogue entry, in its category, with its default props', () => {
    const blocks = cmsBlocks([hero], []);
    const block = blocks.at(-1);
    expect(blocks).toHaveLength(PAGE_BLOCKS.length + 1);
    expect(block).toMatchObject({
      id: 'cms-component-hero',
      label: 'Hero',
      category: 'Marketing',
      attributes: { title: 'Big banner' },
      content: {
        type: 'exy-component',
        attributes: { 'data-key': 'hero', 'data-props': '{"title":"Welcome"}' },
      },
    });
    expect(block?.media).toContain('<svg');
  });

  it('adds one block per fragment after the components, named by its kind', () => {
    const blocks = cmsBlocks([hero], [{ id: 'f1', name: 'Site footer', kind: 'FOOTER' }]);
    expect(blocks.at(-1)).toMatchObject({
      id: 'cms-fragment-f1',
      label: 'Site footer',
      category: 'Fragments',
      attributes: { title: 'footer fragment' },
      content: { type: 'exy-fragment', attributes: { 'data-fragment-id': 'f1' } },
    });
    expect(blocks.at(-2)?.id).toBe('cms-component-hero');
  });
});

describe('PAGE_BLOCKS', () => {
  it('have unique ids and an icon each', () => {
    const ids = PAGE_BLOCKS.map((block) => block.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const block of PAGE_BLOCKS) {
      expect(block.media).toContain('<svg');
    }
  });

  it('offer the HTML embed block on the embed type', () => {
    expect(PAGE_BLOCKS.find((block) => block.id === 'page-embed')?.content).toMatchObject({
      type: 'exy-embed',
    });
  });
});

describe('PLACEHOLDER_CSS', () => {
  it('styles both placeholder tags and labels them from data attributes', () => {
    expect(PLACEHOLDER_CSS).toContain('exy-component, exy-fragment {');
    expect(PLACEHOLDER_CSS).toContain(
      String.raw`content: attr(data-exy-title) "\A" attr(data-exy-summary);`,
    );
    expect(PLACEHOLDER_CSS).toContain('exy-component[data-exy-container]:empty::after');
  });
});
