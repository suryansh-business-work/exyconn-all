import { describe, expect, it } from 'vitest';
import {
  buildDocTree,
  dropTarget,
  isDescendant,
  trailOf,
} from '../../../../../src/pages/projects/docs/doc-tree';
import { docPage } from '../../../fixtures';

/** Cases the original doc-tree suite does not reach: unset parents and a dragged stranger. */
const SPACE = [
  docPage('guide', null, 'Guide'),
  docPage('setup', 'guide', 'Setup'),
  { ...docPage('faq', null, 'FAQ'), parentId: undefined },
];

describe('doc tree edge cases', () => {
  it('treats a page with no parent field at all as top level', () => {
    expect(buildDocTree(SPACE).map((node) => node.page.id)).toEqual(['guide', 'faq']);
    expect(trailOf(SPACE, 'faq').map((page) => page.id)).toEqual(['faq']);
  });

  it('never calls a top-level page the descendant of anything', () => {
    expect(isDescendant(SPACE, 'faq', 'guide')).toBe(false);
    expect(isDescendant(SPACE, 'setup', 'guide')).toBe(true);
  });

  it('refuses to move a page that is not in the space', () => {
    expect(dropTarget(SPACE, 'stranger', 'guide')).toBeNull();
  });

  it('files a page under another branch at the end of that branch', () => {
    expect(dropTarget(SPACE, 'faq', 'setup')).toEqual({ parentId: 'setup', toIndex: 0 });
  });

  it('reorders among the pages filed under the same parent', () => {
    const branch = [...SPACE, docPage('deploy', 'guide', 'Deploy')];

    expect(dropTarget(branch, 'deploy', 'setup')).toEqual({ parentId: 'guide', toIndex: 0 });
  });

  it('reorders among top-level pages whose parent was never set', () => {
    const unset = [
      { ...docPage('a', null, 'A'), parentId: undefined },
      { ...docPage('b', null, 'B'), parentId: undefined },
    ];

    expect(dropTarget(unset, 'b', 'a')).toEqual({ parentId: null, toIndex: 0 });
  });
});
