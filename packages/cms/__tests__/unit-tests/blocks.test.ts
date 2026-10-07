import { describe, it, expect } from 'vitest';
import { COMPONENT_TAG, FRAGMENT_TAG, type CmsBlock } from '../../src/blocks';
import { compileHtml } from '../../src/compile';

describe('placeholder tags', () => {
  it('names the custom elements the editor writes', () => {
    expect(COMPONENT_TAG).toBe('exy-component');
    expect(FRAGMENT_TAG).toBe('exy-fragment');
  });

  it('uses valid custom-element names (lower case, containing a hyphen) that differ', () => {
    for (const tag of [COMPONENT_TAG, FRAGMENT_TAG]) {
      expect(tag).toMatch(/^[a-z][a-z\d]*-[a-z\d-]+$/);
    }
    expect(COMPONENT_TAG).not.toBe(FRAGMENT_TAG);
  });

  it('are the tags the compiler recognises', () => {
    const html = `<${COMPONENT_TAG} data-key="a.b"/><${FRAGMENT_TAG} data-fragment-id="f"/>`;
    const expected: CmsBlock[] = [
      { kind: 'component', key: 'a.b', props: {}, children: [] },
      { kind: 'fragment', fragmentId: 'f' },
    ];
    expect(compileHtml(html, '').blocks).toEqual(expected);
  });
});
