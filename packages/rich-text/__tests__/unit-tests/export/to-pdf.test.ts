import { describe, expect, it } from 'vitest';
import type { Content, ContentTable, CustomTableLayout, DynamicContent } from 'pdfmake/interfaces';
import type { Block, Inline } from '../../../src/export/model';
import type { ImageMap, LoadedImage } from '../../../src/export/images';
import { CONTENT_WIDTH_PT, HEADING_SIZES, INK, PAGE } from '../../../src/export/print';
import { buildPdfDefinition } from '../../../src/export/to-pdf';

const NO_IMAGES: ImageMap = new Map();
const run = (text: string, marks: Partial<Inline> = {}): Inline => ({
  kind: 'text',
  text,
  ...marks,
});
const para = (text: string): Block => ({ kind: 'paragraph', inlines: [run(text)] });
const content = (blocks: Block[], images: ImageMap = NO_IMAGES): Content[] =>
  buildPdfDefinition(blocks, images, 'Doc').content as Content[];

describe('buildPdfDefinition', () => {
  it('sets up an A4 page with the title and numbered pages', () => {
    const definition = buildPdfDefinition([], NO_IMAGES, 'Offer letter');
    expect(definition).toMatchObject({
      info: { title: 'Offer letter' },
      pageSize: 'A4',
      pageMargins: PAGE.margin,
      content: [],
    });
    const footer = definition.footer as DynamicContent;
    expect(footer(2, 5, { width: 0, height: 0, orientation: 'portrait' })).toEqual({
      text: '2 / 5',
      alignment: 'center',
      fontSize: 8,
      color: INK.muted,
    });
  });

  it('draws paragraphs and headings with their runs, keeping an empty line', () => {
    const [plain, empty, heading] = content([
      { kind: 'paragraph', inlines: [run('a'), { kind: 'break' }], align: 'justify' },
      { kind: 'paragraph', inlines: [] },
      { kind: 'heading', level: 2, inlines: [run('Title')], align: 'center' },
    ]);
    expect(plain).toMatchObject({ text: [{ text: 'a' }, { text: '\n' }], alignment: 'justify' });
    expect(empty).toMatchObject({ text: [{ text: ' ' }] });
    expect(heading).toMatchObject({
      text: [{ text: 'Title' }],
      alignment: 'center',
      fontSize: HEADING_SIZES[2],
      bold: true,
    });
  });

  it('carries every mark onto the run', () => {
    const [block] = content([
      {
        kind: 'paragraph',
        inlines: [
          run('a', {
            bold: true,
            italic: true,
            underline: true,
            strike: true,
            sup: true,
            fontSize: 16,
          }),
          run('b', { link: 'https://exyconn.com', code: true, sub: true }),
          run('c', { link: 'https://x.test', color: '#111111', highlight: '#ffd166' }),
        ],
      },
    ]);
    const [a, b, c] = (block as unknown as { text: Record<string, unknown>[] }).text;
    expect(a).toMatchObject({
      bold: true,
      italics: true,
      decoration: ['underline', 'lineThrough'],
      sup: true,
      fontSize: 12,
    });
    expect(b).toMatchObject({
      decoration: ['underline'],
      color: INK.link,
      background: INK.codeFill,
      link: 'https://exyconn.com',
      sub: true,
    });
    expect(c).toMatchObject({ color: '#111111', background: '#ffd166' });
    expect(a).toMatchObject({ color: undefined, background: undefined, link: undefined });
  });

  it('draws bullet, numbered and task lists', () => {
    const [bullets, numbers, tasks] = content([
      { kind: 'list', ordered: false, items: [{ blocks: [para('a')] }] },
      { kind: 'list', ordered: true, items: [{ blocks: [para('b')] }] },
      {
        kind: 'list',
        ordered: false,
        items: [
          { blocks: [para('c')], checked: true },
          { blocks: [], checked: false },
        ],
      },
    ]);
    expect(bullets).toMatchObject({ ul: [{ stack: [{ text: [{ text: 'a' }] }] }] });
    expect(numbers).toMatchObject({ ol: [{ stack: [{ text: [{ text: 'b' }] }] }] });
    expect(tasks).toMatchObject({
      type: 'none',
      ul: [
        {
          columns: [
            { text: '[x]', width: 18 },
            { stack: [{ text: [{ text: 'c' }] }], width: '*' },
          ],
        },
        { columns: [{ text: '[ ]' }, { stack: [] }] },
      ],
    });
  });

  it('draws a quote with a bar on its left edge only', () => {
    const [quote] = content([{ kind: 'quote', blocks: [para('q')] }]) as ContentTable[];
    expect(quote?.table.body).toEqual([
      [
        {
          stack: [expect.objectContaining({ text: [expect.objectContaining({ text: 'q' })] })],
          color: INK.muted,
        },
      ],
    ]);
    const layout = quote?.layout as CustomTableLayout;
    const node = quote as never;
    expect(layout.hLineWidth?.(0, node)).toBe(0);
    expect(layout.vLineWidth?.(0, node)).toBe(2);
    expect(layout.vLineWidth?.(1, node)).toBe(0);
    expect((layout.vLineColor as () => string)()).toBe(INK.quoteBar);
    expect(layout.paddingLeft?.(0, node)).toBe(10);
  });

  it('draws code on a filled panel and a rule across the page', () => {
    const [code, rule] = content([
      { kind: 'code', text: '  x = 1' },
      { kind: 'rule' },
    ]) as ContentTable[];
    expect(code?.table.body).toEqual([
      [{ text: '  x = 1', preserveLeadingSpaces: true, fontSize: 9 }],
    ]);
    expect((code?.layout as CustomTableLayout).fillColor).toBeTypeOf('function');
    expect(((code?.layout as CustomTableLayout).fillColor as () => string)()).toBe(INK.codeFill);
    expect(rule).toMatchObject({
      canvas: [{ type: 'line', x2: CONTENT_WIDTH_PT, lineColor: INK.rule }],
    });
  });

  it('places loaded images at their printed size and shows alt text for the rest', () => {
    const loaded: LoadedImage = {
      dataUrl: 'data:image/png;base64,AA',
      bytes: new Uint8Array(),
      width: 400,
      height: 200,
    };
    const images: ImageMap = new Map([['https://x.test/a.png', loaded]]);
    const [shown, missing] = content(
      [
        { kind: 'image', src: 'https://x.test/a.png', alt: 'A', width: 200 },
        { kind: 'image', src: 'https://x.test/b.png', alt: 'Team photo' },
      ],
      images,
    );
    expect(shown).toMatchObject({ image: 'data:image/png;base64,AA', width: 150 });
    expect(missing).toMatchObject({ text: 'Team photo', italics: true, color: INK.muted });
  });

  it('draws tables with their cells rendered as blocks', () => {
    const [table] = content([
      { kind: 'table', rows: [[{ header: true, colSpan: 1, rowSpan: 1, blocks: [para('H')] }]] },
    ]) as ContentTable[];
    expect(table?.table.body).toEqual([
      [
        expect.objectContaining({
          stack: [expect.objectContaining({ text: [expect.objectContaining({ text: 'H' })] })],
          bold: true,
        }),
      ],
    ]);
  });
});
