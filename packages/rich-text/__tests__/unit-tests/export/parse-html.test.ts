import { describe, expect, it } from 'vitest';
import { parseBlocks, parseHtml } from '../../../src/export/parse-html';

const text = (value: string) => ({ kind: 'text', text: value });

describe('parseHtml', () => {
  it('reads paragraphs and headings with their alignment', () => {
    expect(
      parseHtml(
        '<p style="text-align: center">a</p><p style="text-align: start">b</p><h1>c</h1><h4 style="text-align: right">d</h4><h5>e</h5><h6>f</h6>',
      ),
    ).toEqual([
      { kind: 'paragraph', inlines: [text('a')], align: 'center' },
      { kind: 'paragraph', inlines: [text('b')], align: undefined },
      { kind: 'heading', level: 1, inlines: [text('c')], align: undefined },
      { kind: 'heading', level: 4, inlines: [text('d')], align: 'right' },
      { kind: 'heading', level: 4, inlines: [text('e')], align: undefined },
      { kind: 'heading', level: 4, inlines: [text('f')], align: undefined },
    ]);
    expect(
      parseHtml('<h2>x</h2><h3>y</h3>').map((block) => block.kind === 'heading' && block.level),
    ).toEqual([2, 3]);
  });

  it('reads bullet, numbered and task lists, gathering loose text into paragraphs', () => {
    const [bullets, numbers, tasks] = parseHtml(
      '<ul><li>one</li>text<li><p>two</p></li></ul><ol><li><p>first</p></li></ol>' +
        '<ul data-type="taskList"><li data-type="taskItem" data-checked="true"><label><input type="checkbox"></label><div><p>done</p></div></li><li data-checked="false"><div><p>todo</p></div></li></ul>',
    );
    expect(bullets).toEqual({
      kind: 'list',
      ordered: false,
      items: [
        { blocks: [{ kind: 'paragraph', inlines: [text('one')] }], checked: undefined },
        {
          blocks: [{ kind: 'paragraph', inlines: [text('two')], align: undefined }],
          checked: undefined,
        },
      ],
    });
    expect(numbers).toMatchObject({ kind: 'list', ordered: true, items: [{ checked: undefined }] });
    expect(tasks).toMatchObject({
      kind: 'list',
      ordered: false,
      items: [
        { checked: true, blocks: [{ kind: 'paragraph', inlines: [text('done')] }] },
        { checked: false, blocks: [{ kind: 'paragraph', inlines: [text('todo')] }] },
      ],
    });
  });

  it('reads quotes, code blocks and rules', () => {
    expect(
      parseHtml('<blockquote><p>q</p></blockquote><pre><code>a\n  b</code></pre><hr>'),
    ).toEqual([
      { kind: 'quote', blocks: [{ kind: 'paragraph', inlines: [text('q')], align: undefined }] },
      { kind: 'code', text: 'a\n  b' },
      { kind: 'rule' },
    ]);
  });

  it('reads an image size from its width attribute, then its style', () => {
    expect(
      parseHtml(
        '<img src="https://x.test/a.png" alt="A" width="320"><img src="https://x.test/b.png" style="width: 120px"><img>',
      ),
    ).toEqual([
      { kind: 'image', src: 'https://x.test/a.png', alt: 'A', width: 320 },
      { kind: 'image', src: 'https://x.test/b.png', alt: '', width: 120 },
      { kind: 'image', src: '', alt: '', width: undefined },
    ]);
  });

  it('reads tables with header cells and spans, through their wrapper', () => {
    const [table] = parseHtml(
      '<div class="tableWrapper"><table><tbody><tr><th colspan="2">H</th></tr><tr><td rowspan="0">a</td><td>b</td></tr></tbody></table></div>',
    );
    expect(table).toEqual({
      kind: 'table',
      rows: [
        [
          {
            header: true,
            colSpan: 2,
            rowSpan: 1,
            blocks: [{ kind: 'paragraph', inlines: [text('H')] }],
          },
        ],
        [
          {
            header: false,
            colSpan: 1,
            rowSpan: 1,
            blocks: [{ kind: 'paragraph', inlines: [text('a')] }],
          },
          {
            header: false,
            colSpan: 1,
            rowSpan: 1,
            blocks: [{ kind: 'paragraph', inlines: [text('b')] }],
          },
        ],
      ],
    });
  });

  it('drops whitespace between blocks and returns nothing for an empty document', () => {
    expect(parseHtml('<p>a</p>\n  <p>b</p>')).toHaveLength(2);
    expect(parseHtml('')).toEqual([]);
  });

  it('keeps loose inline content at the top level as a paragraph', () => {
    expect(parseHtml('hello <strong>there</strong><p>p</p>')).toEqual([
      { kind: 'paragraph', inlines: [text('hello '), { kind: 'text', text: 'there', bold: true }] },
      { kind: 'paragraph', inlines: [text('p')], align: undefined },
    ]);
  });
});

describe('parseBlocks', () => {
  it('reads a code block with no text content as empty', () => {
    const host = document.createElement('div');
    const pre = document.createElement('pre');
    Object.defineProperty(pre, 'textContent', { get: () => null });
    host.append(pre);
    expect(parseBlocks(host)).toEqual([{ kind: 'code', text: '' }]);
  });
});
