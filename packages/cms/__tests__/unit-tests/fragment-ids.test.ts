import { describe, it, expect } from 'vitest';
import type { CmsBlock } from '../../src/blocks';
import { fragmentIdsOf } from '../../src/compile';

describe('fragmentIdsOf', () => {
  it('returns nothing for no blocks or only HTML', () => {
    expect(fragmentIdsOf([])).toEqual([]);
    expect(fragmentIdsOf([{ kind: 'html', html: '<p/>' }])).toEqual([]);
  });

  it('collects ids at every depth, once each, in first-seen order', () => {
    const blocks: CmsBlock[] = [
      { kind: 'fragment', fragmentId: 'header' },
      { kind: 'html', html: '<main>' },
      {
        kind: 'component',
        key: 'home.stage',
        props: {},
        children: [
          { kind: 'fragment', fragmentId: 'cta' },
          {
            kind: 'component',
            key: 'x',
            props: {},
            children: [{ kind: 'fragment', fragmentId: 'header' }],
          },
        ],
      },
      { kind: 'component', key: 'leaf', props: {}, children: [] },
      { kind: 'fragment', fragmentId: 'footer' },
    ];
    expect(fragmentIdsOf(blocks)).toEqual(['header', 'cta', 'footer']);
  });
});
