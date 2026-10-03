import type { Content, ContentText, TDocumentDefinitions } from 'pdfmake/interfaces';
import type { Block, Inline, ListItem } from './model';
import { printedSize, type ImageMap } from './images';
import { pdfTable } from './pdf-table';
import {
  BODY_SIZE,
  CONTENT_WIDTH_PT,
  CONTENT_WIDTH_PX,
  HEADING_SIZES,
  INK,
  PAGE,
  PX_TO_PT,
} from './print';

type Decoration = 'underline' | 'lineThrough';

const PARAGRAPH_GAP: [number, number, number, number] = [0, 0, 0, 6];
const QUOTE_INDENT = 10;
const QUOTE_BAR = 2;
const TASK_BOX_WIDTH = 18;
const CODE_SIZE = 9;
const FOOTER_SIZE = 8;

function decorations(run: Extract<Inline, { kind: 'text' }>): Decoration[] | undefined {
  const list: Decoration[] = [];
  if (run.underline || run.link) {
    list.push('underline');
  }
  if (run.strike) {
    list.push('lineThrough');
  }
  return list.length > 0 ? list : undefined;
}

/** One run of text with its marks, as pdfmake draws it. */
function runText(inline: Inline): ContentText {
  if (inline.kind === 'break') {
    return { text: '\n' };
  }
  const linkColour = inline.link ? INK.link : undefined;
  const codeFill = inline.code ? INK.codeFill : undefined;
  return {
    text: inline.text,
    bold: inline.bold,
    italics: inline.italic,
    decoration: decorations(inline),
    color: inline.color ?? linkColour,
    background: inline.highlight ?? codeFill,
    link: inline.link,
    sup: inline.sup,
    sub: inline.sub,
    fontSize: inline.fontSize ? inline.fontSize * PX_TO_PT : undefined,
  };
}

/** A line of runs; an empty paragraph keeps its line, as it does in the editor. */
const runs = (inlines: readonly Inline[]): ContentText[] =>
  inlines.length > 0 ? inlines.map(runText) : [{ text: ' ' }];

function listItem(item: ListItem, images: ImageMap): Content {
  const body = renderBlocks(item.blocks, images);
  if (item.checked === undefined) {
    return { stack: body };
  }
  return {
    columns: [
      { text: item.checked ? '[x]' : '[ ]', width: TASK_BOX_WIDTH },
      { stack: body, width: '*' },
    ],
  };
}

function list(block: Extract<Block, { kind: 'list' }>, images: ImageMap): Content {
  const items = block.items.map((item) => listItem(item, images));
  const tasks = block.items.some((item) => item.checked !== undefined);
  if (tasks) {
    return { ul: items, type: 'none', margin: PARAGRAPH_GAP };
  }
  return block.ordered
    ? { ol: items, margin: PARAGRAPH_GAP }
    : { ul: items, margin: PARAGRAPH_GAP };
}

function image(block: Extract<Block, { kind: 'image' }>, images: ImageMap): Content {
  const loaded = images.get(block.src);
  if (!loaded) {
    return { text: block.alt, italics: true, color: INK.muted, margin: PARAGRAPH_GAP };
  }
  const { width } = printedSize(loaded, block.width, CONTENT_WIDTH_PX);
  return { image: loaded.dataUrl, width: width * PX_TO_PT, margin: PARAGRAPH_GAP };
}

function blockContent(block: Block, images: ImageMap): Content {
  switch (block.kind) {
    case 'paragraph':
      return { text: runs(block.inlines), alignment: block.align, margin: PARAGRAPH_GAP };
    case 'heading':
      return {
        text: runs(block.inlines),
        alignment: block.align,
        fontSize: HEADING_SIZES[block.level],
        bold: true,
        margin: [0, 10, 0, 4],
      };
    case 'list':
      return list(block, images);
    case 'quote':
      return {
        table: {
          widths: ['*'],
          body: [[{ stack: renderBlocks(block.blocks, images), color: INK.muted }]],
        },
        layout: {
          hLineWidth: () => 0,
          vLineWidth: (index) => (index === 0 ? QUOTE_BAR : 0),
          vLineColor: () => INK.quoteBar,
          paddingLeft: () => QUOTE_INDENT,
        },
        margin: PARAGRAPH_GAP,
      };
    case 'code':
      return {
        table: {
          widths: ['*'],
          body: [[{ text: block.text, preserveLeadingSpaces: true, fontSize: CODE_SIZE }]],
        },
        layout: { defaultBorder: false, fillColor: () => INK.codeFill },
        margin: PARAGRAPH_GAP,
      };
    case 'rule':
      return {
        canvas: [
          {
            type: 'line',
            x1: 0,
            y1: 0,
            x2: CONTENT_WIDTH_PT,
            y2: 0,
            lineWidth: 0.5,
            lineColor: INK.rule,
          },
        ],
        margin: [0, 6, 0, 10],
      };
    case 'image':
      return image(block, images);
    case 'table':
      return pdfTable(block.rows, (blocks) => renderBlocks(blocks, images));
  }
}

function renderBlocks(blocks: readonly Block[], images: ImageMap): Content[] {
  return blocks.map((block) => blockContent(block, images));
}

/** The whole PDF: A4, the document's title in its properties, and page numbers in the footer. */
export function buildPdfDefinition(
  blocks: readonly Block[],
  images: ImageMap,
  title: string,
): TDocumentDefinitions {
  return {
    info: { title },
    pageSize: 'A4',
    pageMargins: PAGE.margin,
    defaultStyle: { fontSize: BODY_SIZE, lineHeight: 1.3 },
    content: renderBlocks(blocks, images),
    footer: (current, total) => ({
      text: `${current} / ${total}`,
      alignment: 'center',
      fontSize: FOOTER_SIZE,
      color: INK.muted,
    }),
  };
}
