import {
  COMPONENT_TAG,
  FRAGMENT_TAG,
  type CmsBlock,
  type CmsCompiled,
  type CmsComponentBlock,
} from './blocks';

/** A page the editor produced but the compiler cannot read: the message says where. */
export class CmsCompileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CmsCompileError';
  }
}

/** Every placeholder tag, opening or closing (GrapesJS writes them lower-case). */
const TAG = new RegExp(String.raw`<(/?)(${COMPONENT_TAG}|${FRAGMENT_TAG})\b([^>]*)>`, 'gi');
/**
 * One `name="value"` or `name='value'`. The lookbehind starts a name only at the start of its run,
 * so a long run of name characters is read once rather than once per character.
 */
const ATTRIBUTE = /(?<![\w:-])([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

const ENTITIES: Readonly<Record<string, string>> = {
  '&quot;': '"',
  '&#34;': '"',
  '&#39;': "'",
  '&#x27;': "'",
  '&apos;': "'",
  '&lt;': '<',
  '&gt;': '>',
  '&amp;': '&',
};

/** An attribute value as written, entities undone (`&amp;` last, so `&amp;quot;` stays literal). */
function decodeAttribute(value: string): string {
  return value.replaceAll(/&(?:quot|#34|#39|#x27|apos|lt|gt|amp);/g, (entity) => ENTITIES[entity]);
}

function attributesOf(tagBody: string): Map<string, string> {
  const attributes = new Map<string, string>();
  for (const match of tagBody.matchAll(ATTRIBUTE)) {
    attributes.set(match[1].toLowerCase(), decodeAttribute(match[2] ?? match[3]));
  }
  return attributes;
}

function propsOf(raw: string | undefined, key: string): Record<string, unknown> {
  if (!raw) {
    return {};
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new CmsCompileError(`The settings of component "${key}" are not valid JSON.`);
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new CmsCompileError(`The settings of component "${key}" must be an object.`);
  }
  return parsed as Record<string, unknown>;
}

/** Appends HTML to a list of blocks, merging with a preceding html block; blank HTML is dropped. */
function pushHtml(blocks: CmsBlock[], html: string): void {
  if (html.trim() === '') {
    return;
  }
  const last = blocks.at(-1);
  if (last?.kind === 'html') {
    last.html += html;
    return;
  }
  blocks.push({ kind: 'html', html });
}

interface OpenComponent {
  block: CmsComponentBlock;
  parent: CmsBlock[];
}

interface CompileState {
  root: CmsBlock[];
  stack: OpenComponent[];
  fragmentDepth: number;
}

const isSelfClosing = (body: string) => body.trimEnd().endsWith('/');

/** The list a block read next belongs in: the open component's slot, or the page itself. */
const currentList = (state: CompileState) => state.stack.at(-1)?.block.children ?? state.root;

/** A fragment tag: adds a reference at the top level, and tracks how deep its preview runs. */
function readFragmentTag(state: CompileState, closing: string, body: string): void {
  if (closing) {
    state.fragmentDepth = Math.max(0, state.fragmentDepth - 1);
    return;
  }
  if (state.fragmentDepth === 0) {
    const fragmentId = attributesOf(body).get('data-fragment-id') ?? '';
    if (fragmentId === '') {
      throw new CmsCompileError('A fragment has no fragment selected.');
    }
    currentList(state).push({ kind: 'fragment', fragmentId });
  }
  state.fragmentDepth += isSelfClosing(body) ? 0 : 1;
}

/** A component tag: closes the open component, or adds one (and opens it unless self-closing). */
function readComponentTag(state: CompileState, closing: string, body: string): void {
  if (closing) {
    if (state.stack.length === 0) {
      throw new CmsCompileError('A component is closed that was never opened.');
    }
    state.stack.pop();
    return;
  }
  const attributes = attributesOf(body);
  const key = attributes.get('data-key') ?? '';
  if (key === '') {
    throw new CmsCompileError('A component has no component selected.');
  }
  const block: CmsComponentBlock = {
    kind: 'component',
    key,
    props: propsOf(attributes.get('data-props'), key),
    children: [],
  };
  const parent = currentList(state);
  parent.push(block);
  if (!isSelfClosing(body)) {
    state.stack.push({ block, parent });
  }
}

function assertAllClosed(state: CompileState): void {
  if (state.stack.length > 0) {
    const open = state.stack.at(-1)?.block.key;
    throw new CmsCompileError(`Component "${open}" is never closed.`);
  }
  if (state.fragmentDepth > 0) {
    throw new CmsCompileError('A fragment is never closed.');
  }
}

/**
 * Turns the editor's HTML into the block tree the website renders. Components nest (a
 * container's children are its slot); a fragment's own content in the editor is only a preview
 * and is dropped. Throws CmsCompileError on a placeholder that is malformed or left open.
 */
export function compileHtml(html: string, css: string): CmsCompiled {
  const state: CompileState = { root: [], stack: [], fragmentDepth: 0 };
  let cursor = 0;

  for (const match of html.matchAll(TAG)) {
    const [whole, closing, rawName, body] = match;
    if (state.fragmentDepth === 0) {
      pushHtml(currentList(state), html.slice(cursor, match.index));
    }
    cursor = match.index + whole.length;

    if (rawName.toLowerCase() === FRAGMENT_TAG) {
      readFragmentTag(state, closing, body);
    } else if (state.fragmentDepth === 0) {
      readComponentTag(state, closing, body);
    }
  }

  assertAllClosed(state);
  pushHtml(state.root, html.slice(cursor));
  return { blocks: state.root, css };
}

/** The placeholder HTML for a component: what the editor writes and the seed is made of. */
export function componentPlaceholder(
  key: string,
  props: Record<string, unknown>,
  childrenHtml = '',
): string {
  const json = JSON.stringify(props)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
  return `<${COMPONENT_TAG} data-key="${key}" data-props="${json}">${childrenHtml}</${COMPONENT_TAG}>`;
}

/** The placeholder HTML for a fragment. */
export function fragmentPlaceholder(fragmentId: string): string {
  return `<${FRAGMENT_TAG} data-fragment-id="${fragmentId}"></${FRAGMENT_TAG}>`;
}

/** Every fragment id a block tree refers to, so a renderer can fetch them in one go. */
export function fragmentIdsOf(blocks: readonly CmsBlock[]): string[] {
  const ids = new Set<string>();
  const visit = (list: readonly CmsBlock[]) => {
    for (const block of list) {
      if (block.kind === 'fragment') {
        ids.add(block.fragmentId);
      } else if (block.kind === 'component') {
        visit(block.children);
      }
    }
  };
  visit(blocks);
  return [...ids];
}
