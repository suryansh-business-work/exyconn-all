import { describe, expect, it } from 'vitest';
import {
  blankLike,
  fromTree,
  labelOf,
  moveItem,
  stringEditor,
  toTree,
  type PropNode,
} from '../../../../../../src/pages/website/forms/cms-component-props/props-tree';

const PROPS = {
  title: 'Hello',
  count: 3,
  visible: true,
  missing: null,
  items: ['a', 'b'],
  cta: { label: 'Go', nested: { depth: 2 } },
};

/** Every id in a tree, depth first. */
function idsOf(node: PropNode): string[] {
  if (node.kind === 'array') return [node.id, ...node.items.flatMap(idsOf)];
  if (node.kind === 'object') return [node.id, ...node.entries.flatMap((e) => idsOf(e.node))];
  return [node.id];
}

describe('toTree / fromTree', () => {
  it('round-trips a JSON value through the editable tree', () => {
    expect(fromTree(toTree(PROPS))).toEqual(PROPS);
  });

  it('tags each value with its kind', () => {
    const tree = toTree(PROPS);
    if (tree.kind !== 'object') throw new Error('expected an object');

    expect(tree.entries.map((entry) => [entry.key, entry.node.kind])).toEqual([
      ['title', 'string'],
      ['count', 'number'],
      ['visible', 'boolean'],
      ['missing', 'null'],
      ['items', 'array'],
      ['cta', 'object'],
    ]);
  });

  it('treats anything that is not JSON data as empty', () => {
    expect(toTree(undefined)).toMatchObject({ kind: 'null' });
    expect(fromTree(toTree(undefined))).toBeNull();
  });

  it('gives every node its own id, so list items keep their identity', () => {
    const ids = idsOf(toTree(PROPS));

    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.startsWith('prop-'))).toBe(true);
  });
});

describe('blankLike', () => {
  it('empties each kind of value', () => {
    expect(fromTree(blankLike(toTree('text')))).toBe('');
    expect(fromTree(blankLike(toTree(42)))).toBe(0);
    expect(fromTree(blankLike(toTree(true)))).toBe(false);
    expect(fromTree(blankLike(toTree([1, 2])))).toEqual([]);
    expect(fromTree(blankLike(toTree(null)))).toBeNull();
  });

  it('keeps the shape of an object item with every value emptied', () => {
    const item = toTree({ name: 'Ada', age: 36, tags: ['x'], meta: { active: true } });

    expect(fromTree(blankLike(item))).toEqual({
      name: '',
      age: 0,
      tags: [],
      meta: { active: false },
    });
    expect(blankLike(item).id).not.toBe(item.id);
  });
});

describe('moveItem', () => {
  it('swaps an item with its neighbour, without touching the original list', () => {
    const list = ['a', 'b', 'c'];

    expect(moveItem(list, 1, -1)).toEqual(['b', 'a', 'c']);
    expect(moveItem(list, 1, 1)).toEqual(['a', 'c', 'b']);
    expect(list).toEqual(['a', 'b', 'c']);
  });

  it('leaves the list as it is for a move past either end', () => {
    const list = ['a', 'b'];

    expect(moveItem(list, 0, -1)).toEqual(['a', 'b']);
    expect(moveItem(list, 1, 1)).toEqual(['a', 'b']);
    expect(moveItem(list, 1, 1)).not.toBe(list);
  });
});

describe('stringEditor', () => {
  it('edits html props as rich text', () => {
    expect(stringEditor('html', '')).toBe('rich');
    expect(stringEditor('bodyHtml', '<p>x</p>')).toBe('rich');
  });

  it('edits images with the media picker, by name or by an image URL', () => {
    expect(stringEditor('image', '')).toBe('media');
    expect(stringEditor('logo', '')).toBe('media');
    expect(stringEditor('heroImage', '')).toBe('media');
    expect(stringEditor('backgroundUrl', 'https://cdn.x.com/bg.WEBP?w=800')).toBe('media');
    expect(stringEditor('backgroundUrl', 'https://cdn.x.com/bg.jpeg#top')).toBe('media');
  });

  it('keeps a link that is not an image a plain text field', () => {
    expect(stringEditor('ctaUrl', 'https://exyconn.com/contact')).toBe('text');
    expect(stringEditor('caption', 'image.png')).toBe('text');
  });

  it('gives long or multi-line text a bigger box', () => {
    expect(stringEditor('body', 'x'.repeat(81))).toBe('multiline');
    expect(stringEditor('body', 'x'.repeat(80))).toBe('text');
    expect(stringEditor('address', 'Line 1\nLine 2')).toBe('multiline');
  });
});

describe('labelOf', () => {
  it('turns a prop name into a sentence-case label', () => {
    expect(labelOf('ctaLabel')).toBe('Cta label');
    expect(labelOf('hero_title')).toBe('Hero title');
    expect(labelOf('step2Title')).toBe('Step2 title');
    expect(labelOf('kebab-case-key')).toBe('Kebab case key');
    expect(labelOf('')).toBe('');
  });
});
