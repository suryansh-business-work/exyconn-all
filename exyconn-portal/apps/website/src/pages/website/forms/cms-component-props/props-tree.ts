/**
 * The props of a dynamic component as an editable tree. The form is generated from the value
 * itself (no per-component schema): every node gets a stable id, so list items keep their
 * identity — and their React keys — while they are added, removed and reordered.
 */
export type PropNode =
  | { id: string; kind: 'string'; value: string }
  | { id: string; kind: 'number'; value: number }
  | { id: string; kind: 'boolean'; value: boolean }
  | { id: string; kind: 'null' }
  | { id: string; kind: 'array'; items: PropNode[] }
  | { id: string; kind: 'object'; entries: PropEntry[] };

export interface PropEntry {
  key: string;
  node: PropNode;
}

let sequence = 0;
const nextId = (): string => {
  sequence += 1;
  return `prop-${sequence}`;
};

/** Builds the tree for a JSON value. */
export function toTree(value: unknown): PropNode {
  const id = nextId();
  if (typeof value === 'string') return { id, kind: 'string', value };
  if (typeof value === 'number') return { id, kind: 'number', value };
  if (typeof value === 'boolean') return { id, kind: 'boolean', value };
  if (Array.isArray(value)) return { id, kind: 'array', items: value.map(toTree) };
  if (value !== null && typeof value === 'object') {
    return {
      id,
      kind: 'object',
      entries: Object.entries(value).map(([key, child]) => ({ key, node: toTree(child) })),
    };
  }
  return { id, kind: 'null' };
}

/** The JSON value a tree stands for. */
export function fromTree(node: PropNode): unknown {
  switch (node.kind) {
    case 'array':
      return node.items.map(fromTree);
    case 'object':
      return Object.fromEntries(node.entries.map((entry) => [entry.key, fromTree(entry.node)]));
    case 'null':
      return null;
    default:
      return node.value;
  }
}

/** A new list item shaped like an existing one, with every value emptied. */
export function blankLike(node: PropNode): PropNode {
  const id = nextId();
  switch (node.kind) {
    case 'string':
      return { id, kind: 'string', value: '' };
    case 'number':
      return { id, kind: 'number', value: 0 };
    case 'boolean':
      return { id, kind: 'boolean', value: false };
    case 'array':
      return { id, kind: 'array', items: [] };
    case 'object':
      return {
        id,
        kind: 'object',
        entries: node.entries.map((entry) => ({ key: entry.key, node: blankLike(entry.node) })),
      };
    default:
      return { id, kind: 'null' };
  }
}

/** Moves one item of a list up (-1) or down (+1); out-of-range moves leave it as it is. */
export function moveItem<T>(items: readonly T[], index: number, offset: -1 | 1): T[] {
  const target = index + offset;
  if (target < 0 || target >= items.length) return [...items];
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

const IMAGE_EXTENSION = /\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i;
const IMAGE_KEYS = new Set(['image', 'src', 'logo', 'avatar', 'poster']);

/** How a string prop is edited, from its name and value (contract §1). */
export function stringEditor(key: string, value: string): 'rich' | 'media' | 'multiline' | 'text' {
  if (key === 'html' || key.endsWith('Html')) return 'rich';
  const imageByName = IMAGE_KEYS.has(key) || key.endsWith('Image');
  const imageByUrl = key.endsWith('Url') && IMAGE_EXTENSION.test(value);
  if (imageByName || imageByUrl) return 'media';
  return value.length > 80 || value.includes('\n') ? 'multiline' : 'text';
}

/** A prop name as a label: `ctaLabel` → "Cta label", `hero_title` → "Hero title". */
export function labelOf(key: string): string {
  const words = key
    .replaceAll(/([a-z\d])([A-Z])/g, '$1 $2')
    .replaceAll(/[_-]+/g, ' ')
    .trim()
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
