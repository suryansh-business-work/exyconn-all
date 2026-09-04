import { describe, it, expect } from 'vitest';
import {
  buildDocTree,
  dropTarget,
  isDescendant,
  trailOf,
} from '../../src/pages/projects/docs/doc-tree';
import type { DocPageFieldsFragment } from '@exyconn/shell/graphql/generated';

const page = (id: string, parentId: string | null, title: string): DocPageFieldsFragment => ({
  __typename: 'DocPage',
  id,
  projectId: 'proj-1',
  parentId,
  title,
  order: 0,
  updatedByName: 'Asha Rao',
  updatedAt: '2026-09-04T00:00:00.000Z',
});

const SPACE = [
  page('runbooks', null, 'Runbooks'),
  page('releasing', 'runbooks', 'Releasing'),
  page('rollback', 'releasing', 'Rolling back'),
  page('decisions', null, 'Decisions'),
];

describe('buildDocTree', () => {
  it('nests a page under its parent instead of listing it at the top', () => {
    const roots = buildDocTree(SPACE);

    expect(roots.map((node) => node.page.id)).toEqual(['runbooks', 'decisions']);
    expect(roots[0].children.map((node) => node.page.id)).toEqual(['releasing']);
  });

  it('keeps nesting past the second level', () => {
    const [runbooks] = buildDocTree(SPACE);

    expect(runbooks.children[0].children[0].page.title).toBe('Rolling back');
  });

  it('shows an orphaned page at the top rather than dropping it', () => {
    // Its parent was deleted elsewhere; a page nobody can see is a page nobody can fix.
    const roots = buildDocTree([page('stray', 'deleted-parent', 'Stray')]);

    expect(roots.map((node) => node.page.id)).toEqual(['stray']);
  });

  it('has no roots for an empty space', () => {
    expect(buildDocTree([])).toEqual([]);
  });
});

describe('trailOf', () => {
  it('reads from the root down to the open page', () => {
    expect(trailOf(SPACE, 'rollback').map((step) => step.title)).toEqual([
      'Runbooks',
      'Releasing',
      'Rolling back',
    ]);
  });

  it('is just the page itself for a top-level page', () => {
    expect(trailOf(SPACE, 'decisions').map((step) => step.title)).toEqual(['Decisions']);
  });

  it('is empty for a page that is not in the space', () => {
    expect(trailOf(SPACE, 'nope')).toEqual([]);
  });
});

describe('isDescendant', () => {
  it('sees a grandchild as part of the branch', () => {
    expect(isDescendant(SPACE, 'rollback', 'runbooks')).toBe(true);
  });

  it('does not see a page in another branch as part of it', () => {
    expect(isDescendant(SPACE, 'decisions', 'runbooks')).toBe(false);
  });
});

describe('dropTarget', () => {
  it('reorders to the position of a sibling it is dropped on', () => {
    // Both are top level, so this is a sort, not a re-home.
    expect(dropTarget(SPACE, 'decisions', 'runbooks')).toEqual({ parentId: null, toIndex: 0 });
  });

  it('files a page under the page it is dropped on when they are not siblings', () => {
    expect(dropTarget(SPACE, 'decisions', 'releasing')).toEqual({
      parentId: 'releasing',
      toIndex: 1,
    });
  });

  it('refuses a drop on the page itself', () => {
    expect(dropTarget(SPACE, 'runbooks', 'runbooks')).toBeNull();
  });

  it('refuses a drop inside the page’s own branch, which would orphan it', () => {
    expect(dropTarget(SPACE, 'runbooks', 'rollback')).toBeNull();
  });

  it('refuses a drop involving a page that is not in the space', () => {
    expect(dropTarget(SPACE, 'runbooks', 'nope')).toBeNull();
  });
});
