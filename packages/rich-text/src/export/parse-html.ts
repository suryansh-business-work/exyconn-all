import type { Align, Block, Inline, ListItem, TableCell } from './model';
import { pixels } from './css';
import { hasContent, inlineFrom, parseInlines } from './parse-inline';

type BlockParser = (element: HTMLElement) => Block[];

const ALIGNS = new Set<string>(['left', 'center', 'right', 'justify']);

const HEADING_LEVELS: Readonly<Record<string, 1 | 2 | 3 | 4>> = {
  H1: 1,
  H2: 2,
  H3: 3,
  H4: 4,
  H5: 4,
  H6: 4,
};

function alignOf(element: HTMLElement): Align | undefined {
  const value = element.style.textAlign;
  return ALIGNS.has(value) ? (value as Align) : undefined;
}

function listOf(element: HTMLElement, ordered: boolean): Block {
  const tasks = element.dataset.type === 'taskList';
  const items: ListItem[] = [...element.children]
    .filter((child): child is HTMLElement => child instanceof HTMLElement && child.tagName === 'LI')
    .map((item) => ({
      blocks: parseBlocks(item),
      checked: tasks ? item.dataset.checked === 'true' : undefined,
    }));
  return { kind: 'list', ordered, items };
}

function imageOf(element: HTMLElement): Block {
  const declared = Number.parseFloat(element.getAttribute('width') ?? '');
  return {
    kind: 'image',
    src: element.getAttribute('src') ?? '',
    alt: element.getAttribute('alt') ?? '',
    width: Number.isNaN(declared) ? pixels(element.style.width) : declared,
  };
}

function tableOf(element: HTMLElement): Block {
  const table = element as HTMLTableElement;
  const rows = [...table.rows].map((row) =>
    [...row.cells].map((cell): TableCell => ({
      header: cell.tagName === 'TH',
      colSpan: Math.max(cell.colSpan, 1),
      rowSpan: Math.max(cell.rowSpan, 1),
      blocks: parseBlocks(cell),
    })),
  );
  return { kind: 'table', rows };
}

function heading(element: HTMLElement): Block[] {
  return [
    {
      kind: 'heading',
      level: HEADING_LEVELS[element.tagName] ?? 1,
      inlines: parseInlines(element),
      align: alignOf(element),
    },
  ];
}

/** Every element that starts a block of its own, and how it is read. */
const PARSERS: Readonly<Record<string, BlockParser>> = {
  P: (element) => [{ kind: 'paragraph', inlines: parseInlines(element), align: alignOf(element) }],
  H1: heading,
  H2: heading,
  H3: heading,
  H4: heading,
  H5: heading,
  H6: heading,
  UL: (element) => [listOf(element, false)],
  OL: (element) => [listOf(element, true)],
  BLOCKQUOTE: (element) => [{ kind: 'quote', blocks: parseBlocks(element) }],
  PRE: (element) => [{ kind: 'code', text: element.textContent ?? '' }],
  HR: () => [{ kind: 'rule' }],
  IMG: (element) => [imageOf(element)],
  TABLE: (element) => [tableOf(element)],
  // Wrappers the editor puts round a table or a task's text: read straight through.
  DIV: (element) => parseBlocks(element),
  // A task's checkbox; its state is read from the list item instead.
  LABEL: () => [],
};

/**
 * The blocks inside an element. Loose inline content between blocks — text straight inside a
 * list item or a table cell — is gathered into a paragraph of its own.
 */
export function parseBlocks(container: Node): Block[] {
  const blocks: Block[] = [];
  let loose: Inline[] = [];
  const flush = () => {
    if (hasContent(loose)) {
      blocks.push({ kind: 'paragraph', inlines: loose });
    }
    loose = [];
  };
  for (const child of container.childNodes) {
    const element = child instanceof HTMLElement ? child : null;
    const parser = element ? PARSERS[element.tagName] : undefined;
    if (element && parser) {
      flush();
      blocks.push(...parser(element));
    } else {
      loose.push(...inlineFrom(child, {}));
    }
  }
  flush();
  return blocks;
}

/** The editor's HTML as the document model both file formats are rendered from. */
export function parseHtml(html: string): Block[] {
  const document = new DOMParser().parseFromString(html, 'text/html');
  return parseBlocks(document.body);
}
