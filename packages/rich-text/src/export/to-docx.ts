import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  WidthType,
  type FileChild,
  type IParagraphOptions,
} from 'docx';
import type { Align, Block, Inline, ListItem, TableCell as CellModel } from './model';
import { fill, wordColour, wordInline, type RunOverrides } from './docx-runs';
import { printedSize, type ImageMap } from './images';
import { headerRowCount, spanGrid } from './table-grid';
import {
  BODY_SIZE,
  CONTENT_WIDTH_PX,
  CONTENT_WIDTH_TWIPS,
  HEADING_SIZES,
  INK,
  PAGE_MARGIN_TWIPS,
  WORD_FONTS,
} from './print';

const ORDERED = 'ordered';
const LEVELS = 9;
/** Word measures indents in twentieths of a point; a level steps in by a quarter inch more. */
const INDENT_STEP = 360;
const QUOTE_INDENT = 360;
const RULE_SIZE = 6;
const QUOTE_BAR_SIZE = 12;
const CODE_SIZE = 18;

const ALIGNMENT: Readonly<Record<Align, (typeof AlignmentType)[keyof typeof AlignmentType]>> = {
  left: AlignmentType.LEFT,
  center: AlignmentType.CENTER,
  right: AlignmentType.RIGHT,
  justify: AlignmentType.JUSTIFIED,
};

const HEADINGS = {
  1: HeadingLevel.HEADING_1,
  2: HeadingLevel.HEADING_2,
  3: HeadingLevel.HEADING_3,
  4: HeadingLevel.HEADING_4,
} as const;

/** Where a block sits: how deep in lists, inside a quote, inside a header cell. */
interface Context {
  images: ImageMap;
  /** -1 outside any list. */
  level: number;
  quote: boolean;
  runs: RunOverrides;
  /** Set on the first paragraph of a list item: the bullet, number or checkbox it carries. */
  marker?: Pick<IParagraphOptions, 'bullet' | 'numbering'> & { task?: boolean };
  /** One per ordered list, so each one counts from 1. */
  nextList: () => number;
}

function paragraph(ctx: Context, options: IParagraphOptions): Paragraph {
  const quote = ctx.quote
    ? {
        indent: { left: QUOTE_INDENT },
        border: {
          left: {
            style: BorderStyle.SINGLE,
            size: QUOTE_BAR_SIZE,
            color: wordColour(INK.quoteBar),
            space: 8,
          },
        },
      }
    : {};
  const { task, ...marker } = ctx.marker ?? {};
  const indent = task ? { indent: { left: INDENT_STEP * (ctx.level + 1) } } : {};
  return new Paragraph({ ...quote, ...indent, ...marker, ...options });
}

function textParagraph(inlines: readonly Inline[], ctx: Context, options: IParagraphOptions = {}) {
  return paragraph(ctx, {
    children: inlines.map((inline) => wordInline(inline, ctx.runs)),
    ...options,
  });
}

type Marker = NonNullable<Context['marker']>;

const EMPTY_PARAGRAPH: Block = { kind: 'paragraph', inlines: [] };

/** The bullet, number or checkbox a list item starts with. */
function markerFor(item: ListItem, ordered: boolean, level: number, instance: number): Marker {
  if (item.checked !== undefined) {
    return { task: true };
  }
  if (ordered) {
    return { numbering: { reference: ORDERED, level, instance } };
  }
  return { bullet: { level } };
}

/** A task item's first paragraph, with its checkbox written in front of the text. */
function withTaskBox(block: Block, item: ListItem): Block {
  if (item.checked === undefined || block.kind !== 'paragraph') {
    return block;
  }
  const box = item.checked ? '[x] ' : '[ ] ';
  return { ...block, inlines: [{ kind: 'text', text: box }, ...block.inlines] };
}

/** A list item's blocks; only its first paragraph carries the marker. */
function listItem(item: ListItem, ordered: boolean, instance: number, ctx: Context): FileChild[] {
  const level = ctx.level + 1;
  const marker = markerFor(item, ordered, level, instance);
  const blocks = item.blocks.length > 0 ? item.blocks : [EMPTY_PARAGRAPH];
  return blocks.flatMap((block, index) =>
    index === 0
      ? render(withTaskBox(block, item), { ...ctx, level, marker })
      : render(block, { ...ctx, level, marker: undefined }),
  );
}

function cell(model: CellModel, columnWidth: number, ctx: Context): TableCell {
  const inner = {
    ...ctx,
    level: -1,
    quote: false,
    marker: undefined,
    runs: { bold: model.header },
  };
  const children = model.blocks.flatMap((block) => render(block, inner));
  return new TableCell({
    children: children.length > 0 ? children : [new Paragraph({})],
    columnSpan: model.colSpan,
    rowSpan: model.rowSpan,
    width: { size: columnWidth * model.colSpan, type: WidthType.DXA },
    shading: model.header ? fill(INK.headerFill) : undefined,
  });
}

/**
 * A table across the full text width, its columns equal. Word needs the widths written out:
 * without them a reader that lays the table out itself squeezes every column to a letter.
 */
function table(rows: readonly CellModel[][], ctx: Context): Table {
  const headers = headerRowCount(rows);
  const columns = spanGrid(rows)[0]?.length ?? 1;
  const columnWidth = Math.floor(CONTENT_WIDTH_TWIPS / columns);
  return new Table({
    width: { size: columnWidth * columns, type: WidthType.DXA },
    columnWidths: Array.from({ length: columns }, () => columnWidth),
    layout: TableLayoutType.FIXED,
    rows: rows.map(
      (row, index) =>
        new TableRow({
          tableHeader: index < headers,
          children: row.map((model) => cell(model, columnWidth, ctx)),
        }),
    ),
  });
}

function image(block: Extract<Block, { kind: 'image' }>, ctx: Context): Paragraph {
  const loaded = ctx.images.get(block.src);
  if (!loaded) {
    return textParagraph([{ kind: 'text', text: block.alt, italic: true }], ctx);
  }
  const size = printedSize(loaded, block.width, CONTENT_WIDTH_PX);
  return paragraph(ctx, {
    children: [
      new ImageRun({
        type: 'png',
        data: loaded.bytes,
        transformation: size,
        altText: { name: block.alt, description: block.alt, title: block.alt },
      }),
    ],
  });
}

function render(block: Block, ctx: Context): FileChild[] {
  switch (block.kind) {
    case 'paragraph':
      return [
        textParagraph(block.inlines, ctx, { alignment: block.align && ALIGNMENT[block.align] }),
      ];
    case 'heading':
      return [
        textParagraph(block.inlines, ctx, {
          heading: HEADINGS[block.level],
          alignment: block.align && ALIGNMENT[block.align],
        }),
      ];
    case 'list': {
      const instance = ctx.nextList();
      return block.items.flatMap((item) => listItem(item, block.ordered, instance, ctx));
    }
    case 'quote':
      return block.blocks.flatMap((inner) => render(inner, { ...ctx, quote: true }));
    case 'code':
      return block.text.split('\n').map((line) =>
        paragraph(ctx, {
          children: [new TextRun({ text: line, font: WORD_FONTS.mono, size: CODE_SIZE })],
          shading: fill(INK.codeFill),
          spacing: { after: 0 },
        }),
      );
    case 'rule':
      return [
        paragraph(ctx, {
          border: {
            bottom: {
              style: BorderStyle.SINGLE,
              size: RULE_SIZE,
              color: wordColour(INK.rule),
              space: 1,
            },
          },
        }),
      ];
    case 'image':
      return [image(block, ctx)];
    case 'table':
      return [table(block.rows, ctx), new Paragraph({})];
  }
}

/** Decimal numbering at every level, each level stepped in further than the last. */
const orderedNumbering = {
  reference: ORDERED,
  levels: Array.from({ length: LEVELS }, (_, level) => ({
    level,
    format: LevelFormat.DECIMAL,
    text: `%${level + 1}.`,
    alignment: AlignmentType.START,
    style: { paragraph: { indent: { left: INDENT_STEP * (level + 2), hanging: INDENT_STEP } } },
  })),
};

/** Word measures text in half-points. */
const halfPoints = (points: number) => Math.round(points * 2);

/** Paragraph spacing, in twips: room after a paragraph, more round a heading. */
const SPACING = { after: 120, headingBefore: 240, headingAfter: 80 } as const;

/** A heading style that matches the PDF's: the document ink, bold, at the PDF's size. */
const headingStyle = (level: 1 | 2 | 3 | 4) => ({
  run: {
    font: WORD_FONTS.body,
    size: halfPoints(HEADING_SIZES[level]),
    bold: true,
    color: wordColour(INK.heading),
  },
  paragraph: { spacing: { before: SPACING.headingBefore, after: SPACING.headingAfter } },
});

/** The whole Word document, as a file ready to save. */
export function buildDocx(
  blocks: readonly Block[],
  images: ImageMap,
  title: string,
): Promise<Blob> {
  let lists = 0;
  const nextList = () => {
    lists += 1;
    return lists;
  };
  const ctx: Context = { images, level: -1, quote: false, runs: {}, nextList };
  const document = new Document({
    title,
    numbering: { config: [orderedNumbering] },
    styles: {
      default: {
        document: {
          run: { font: WORD_FONTS.body, size: halfPoints(BODY_SIZE) },
          paragraph: { spacing: { after: SPACING.after } },
        },
        heading1: headingStyle(1),
        heading2: headingStyle(2),
        heading3: headingStyle(3),
        heading4: headingStyle(4),
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: PAGE_MARGIN_TWIPS,
              bottom: PAGE_MARGIN_TWIPS,
              left: PAGE_MARGIN_TWIPS,
              right: PAGE_MARGIN_TWIPS,
            },
          },
        },
        children: blocks.flatMap((block) => render(block, ctx)),
      },
    ],
  });
  return Packer.toBlob(document);
}
