import { describe, expect, it } from 'vitest';
import type { Block, Inline } from '../../../src/export/model';
import type { ImageMap, LoadedImage } from '../../../src/export/images';
import { buildDocx } from '../../../src/export/to-docx';
import { INK } from '../../../src/export/print';
import { docxPart } from './docx-xml';

const NO_IMAGES: ImageMap = new Map();
const run = (text: string): Inline => ({ kind: 'text', text });
const para = (text: string): Block => ({ kind: 'paragraph', inlines: [run(text)] });
const documentXml = async (blocks: Block[], images: ImageMap = NO_IMAGES) =>
  docxPart(await buildDocx(blocks, images, 'Doc'));
const count = (xml: string, needle: string) => xml.split(needle).length - 1;

describe('buildDocx', () => {
  it('writes a Word file with the title and the page set up', async () => {
    const blob = await buildDocx([para('Hello')], NO_IMAGES, 'Offer letter');
    expect(blob).toBeInstanceOf(Blob);
    expect(await docxPart(blob, 'docProps/core.xml')).toContain('Offer letter');
    const xml = await docxPart(blob);
    expect(xml).toContain('Hello');
    expect(xml).toContain('w:top="1120"');
    const styles = await docxPart(blob, 'word/styles.xml');
    expect(styles).toContain('Calibri');
    expect(styles).toContain(INK.heading.slice(1));
  });

  it('writes paragraphs and headings with their alignment', async () => {
    const xml = await documentXml([
      { kind: 'paragraph', inlines: [run('a')], align: 'justify' },
      { kind: 'paragraph', inlines: [run('plain')] },
      { kind: 'heading', level: 3, inlines: [run('Title')], align: 'right' },
      { kind: 'heading', level: 1, inlines: [run('Top')] },
    ]);
    expect(xml).toContain('w:val="both"');
    expect(xml).toContain('w:val="right"');
    expect(xml).toContain('w:val="Heading3"');
    expect(xml).toContain('w:val="Heading1"');
  });

  it('numbers each ordered list from one and bullets the rest, nesting by level', async () => {
    const nested: Block = { kind: 'list', ordered: false, items: [{ blocks: [para('inner')] }] };
    const xml = await documentXml([
      {
        kind: 'list',
        ordered: true,
        items: [{ blocks: [para('one'), para('more')] }, { blocks: [] }],
      },
      { kind: 'list', ordered: true, items: [{ blocks: [para('again'), nested] }] },
    ]);
    // "one", the empty second item, "again" and "inner" carry markers; "more" does not.
    expect(count(xml, '<w:numPr>')).toBe(4);
    expect(xml).toContain('<w:p><w:r><w:t xml:space="preserve">more</w:t>');
    // Each ordered list gets its own numbering instance, so the second starts again at 1.
    expect(count(xml, '<w:numId w:val="2"/>')).toBe(2);
    expect(count(xml, '<w:numId w:val="3"/>')).toBe(1);
    expect(xml).toContain(
      '<w:ilvl w:val="1"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t xml:space="preserve">inner',
    );
  });

  it('writes a task item with its checkbox in front of the text, indented', async () => {
    const xml = await documentXml([
      {
        kind: 'list',
        ordered: false,
        items: [
          { blocks: [para('done')], checked: true },
          { blocks: [para('todo')], checked: false },
          {
            blocks: [{ kind: 'heading', level: 2, inlines: [run('Heading task')] }],
            checked: false,
          },
        ],
      },
    ]);
    expect(xml).toContain('[x] ');
    expect(xml).toContain('[ ] ');
    expect(count(xml, '[ ] ')).toBe(1);
    expect(xml).toContain('w:left="360"');
    expect(xml).not.toContain('<w:numPr>');
  });

  it('writes quotes with a bar, code line by line and a rule', async () => {
    const xml = await documentXml([
      { kind: 'quote', blocks: [para('quoted')] },
      { kind: 'code', text: 'line one\nline two' },
      { kind: 'rule' },
    ]);
    expect(xml).toContain(INK.quoteBar.slice(1));
    expect(xml).toContain('Consolas');
    expect(xml).toContain('line one');
    expect(xml).toContain('line two');
    expect(xml).toContain(INK.codeFill.slice(1));
    expect(xml).toContain(INK.rule.slice(1));
  });

  it('embeds loaded images and writes the alt text of the rest', async () => {
    const loaded: LoadedImage = {
      dataUrl: '',
      bytes: Uint8Array.from([137, 80, 78, 71]),
      width: 400,
      height: 200,
    };
    const xml = await documentXml(
      [
        { kind: 'image', src: 'https://x.test/a.png', alt: 'Shown', width: 200 },
        { kind: 'image', src: 'https://x.test/b.png', alt: 'Missing photo' },
      ],
      new Map([['https://x.test/a.png', loaded]]),
    );
    expect(xml).toContain('descr="Shown"');
    expect(xml).toContain('Missing photo');
    expect(xml).toContain('<w:i/>');
  });

  it('writes tables full width with header rows, spans and empty cells', async () => {
    const xml = await documentXml([
      {
        kind: 'table',
        rows: [
          [{ header: true, colSpan: 2, rowSpan: 1, blocks: [para('Head')] }],
          [
            { header: false, colSpan: 1, rowSpan: 1, blocks: [para('a')] },
            { header: false, colSpan: 1, rowSpan: 1, blocks: [] },
          ],
        ],
      },
      { kind: 'table', rows: [] },
    ]);
    expect(xml).toContain('<w:tblHeader/>');
    expect(xml).toContain('<w:gridSpan w:val="2"/>');
    expect(xml).toContain(INK.headerFill.slice(1));
    expect(xml).toContain('w:type="fixed"');
    expect(count(xml, '<w:tbl>')).toBe(2);
  });
});
