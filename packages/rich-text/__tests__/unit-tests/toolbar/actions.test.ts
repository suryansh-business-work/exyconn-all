import { describe, expect, it } from 'vitest';
import { BLOCK_TYPES, activeBlockType } from '../../../src/toolbar/block-types';
import {
  INSERT_TABLE,
  TABLE_ACTIONS,
  canRunTableAction,
  runTableAction,
} from '../../../src/toolbar/table-actions';
import { BLOCK_ACTIONS } from '../../../src/toolbar/toolbar.config';
import { editorFactory } from '../editor';

const create = editorFactory();

const blockAction = (key: string) => BLOCK_ACTIONS.find((action) => action.key === key);
const tableAction = (key: string) =>
  TABLE_ACTIONS.find((action) => action.key === key) ?? INSERT_TABLE;
const count = (html: string, needle: RegExp) => html.match(needle)?.length ?? 0;

describe('block actions', () => {
  it('toggles lists, task lists and quotes, reporting each as active', () => {
    for (const key of ['bulletList', 'orderedList', 'taskList', 'blockquote']) {
      const editor = create('<p>text</p>');
      editor.commands.setTextSelection(2);
      expect(blockAction(key)?.isActive?.(editor)).toBe(false);
      blockAction(key)?.run(editor);
      expect(blockAction(key)?.isActive?.(editor)).toBe(true);
    }
  });

  it('inserts a divider and clears marks and blocks', () => {
    const editor = create('<h2><strong>Title</strong></h2>');
    editor.commands.selectAll();
    blockAction('clear')?.run(editor);
    expect(editor.getHTML()).toMatch(/^<p>Title<\/p>/);
    blockAction('horizontalRule')?.run(editor);
    expect(editor.getHTML()).toContain('<hr>');
    expect(blockAction('horizontalRule')?.isActive).toBeUndefined();
  });
});

describe('block types', () => {
  it('turns a heading back into a paragraph and a paragraph into a code block', () => {
    const editor = create('<h3>text</h3>');
    editor.commands.setTextSelection(2);
    expect(activeBlockType(editor)).toBe('h3');
    BLOCK_TYPES.find((type) => type.value === 'paragraph')?.apply(editor);
    expect(editor.getHTML()).toMatch(/^<p>text<\/p>/);
    BLOCK_TYPES.find((type) => type.value === 'codeBlock')?.apply(editor);
    expect(editor.getHTML()).toMatch(/^<pre><code>text<\/code><\/pre>/);
    expect(activeBlockType(editor)).toBe('codeBlock');
  });

  it('reports no block type inside a block it does not list', () => {
    const editor = create('<ul><li><p>item</p></li></ul>');
    editor.commands.setTextSelection(3);
    expect(activeBlockType(editor)).toBe('paragraph');
    const quote = create('<blockquote><p>q</p></blockquote>');
    quote.commands.selectAll();
    expect(activeBlockType(quote)).toBe('');
  });
});

describe('table actions', () => {
  it('cannot edit a table when the caret is outside one', () => {
    const editor = create('<p>text</p>');
    for (const action of TABLE_ACTIONS) {
      expect(canRunTableAction(editor, action)).toBe(false);
    }
  });

  it('adds and removes rows and columns around the caret', () => {
    const editor = create('<p></p>');
    runTableAction(editor, INSERT_TABLE);
    runTableAction(editor, tableAction('addRowBefore'));
    expect(count(editor.getHTML(), /<tr>/g)).toBe(4);
    runTableAction(editor, tableAction('addColumnBefore'));
    runTableAction(editor, tableAction('addColumnAfter'));
    expect(count(editor.getHTML(), /<th /g)).toBe(5);
    runTableAction(editor, tableAction('deleteColumn'));
    expect(count(editor.getHTML(), /<th /g)).toBe(4);
  });

  it('merges a multi-cell selection and splits it again', () => {
    const editor = create(
      '<table><tbody><tr><td><p>a</p></td><td><p>b</p></td></tr></tbody></table>',
    );
    editor.commands.setTextSelection(3);
    expect(canRunTableAction(editor, tableAction('mergeCells'))).toBe(false);
    const cells: number[] = [];
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'tableCell') {
        cells.push(pos);
      }
    });
    editor.commands.setCellSelection({ anchorCell: cells[0] ?? 0, headCell: cells[1] ?? 0 });
    expect(canRunTableAction(editor, tableAction('mergeCells'))).toBe(true);
    runTableAction(editor, tableAction('mergeCells'));
    expect(editor.getHTML()).toContain('colspan="2"');
    runTableAction(editor, tableAction('splitCell'));
    expect(editor.getHTML()).not.toContain('colspan="2"');
  });

  it('toggles the header row and header column', () => {
    const editor = create(
      '<table><tbody><tr><td><p>a</p></td><td><p>b</p></td></tr><tr><td><p>c</p></td><td><p>d</p></td></tr></tbody></table>',
    );
    editor.commands.setTextSelection(3);
    runTableAction(editor, tableAction('toggleHeaderRow'));
    expect(count(editor.getHTML(), /<th /g)).toBe(2);
    runTableAction(editor, tableAction('toggleHeaderColumn'));
    expect(count(editor.getHTML(), /<th /g)).toBe(3);
  });
});
