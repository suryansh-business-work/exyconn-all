import { afterEach, describe, expect, it } from 'vitest';
import { Editor } from '@tiptap/core';
import { buildExtensions } from '../../src/extensions';
import { BLOCK_TYPES, activeBlockType } from '../../src/toolbar/block-types';
import {
  INSERT_TABLE,
  TABLE_ACTIONS,
  canRunTableAction,
  runTableAction,
} from '../../src/toolbar/table-actions';
import { ALIGN_ACTIONS, MARK_ACTIONS } from '../../src/toolbar/toolbar.config';

let editor: Editor | null = null;

const create = (content: string): Editor => {
  editor = new Editor({ extensions: buildExtensions(''), content });
  editor.commands.selectAll();
  return editor;
};

const tableAction = (key: string) => {
  const action = TABLE_ACTIONS.find((candidate) => candidate.key === key);
  if (!action) {
    throw new Error(`No table action ${key}`);
  }
  return action;
};

afterEach(() => {
  editor?.destroy();
  editor = null;
});

describe('toolbar actions', () => {
  it('toggles every mark on the selection', () => {
    const target = create('<p>text</p>');
    for (const action of MARK_ACTIONS) {
      action.run(target);
      expect(action.isActive?.(target)).toBe(true);
      action.run(target);
      expect(action.isActive?.(target)).toBe(false);
    }
  });

  it('aligns the block and reports it as active', () => {
    const target = create('<p>text</p>');
    const centre = ALIGN_ACTIONS.find((action) => action.key === 'align-center');
    centre?.run(target);
    expect(target.getHTML()).toBe('<p style="text-align: center;">text</p>');
    expect(centre?.isActive?.(target)).toBe(true);
  });

  it('switches the block type and reads it back', () => {
    const target = create('<p>text</p>');
    expect(activeBlockType(target)).toBe('paragraph');
    BLOCK_TYPES.find((type) => type.value === 'h2')?.apply(target);
    // StarterKit keeps a paragraph after the last block, so there is always a line to type on.
    expect(target.getHTML()).toBe('<h2>text</h2><p></p>');
    // The selection still spans both blocks, which the picker shows as mixed.
    expect(activeBlockType(target)).toBe('');
    target.commands.setTextSelection(2);
    expect(activeBlockType(target)).toBe('h2');
  });
});

describe('table actions', () => {
  it('inserts a 3 × 3 table with a header row', () => {
    const target = create('<p></p>');
    expect(canRunTableAction(target, INSERT_TABLE)).toBe(true);
    runTableAction(target, INSERT_TABLE);
    const html = target.getHTML();
    expect(html.match(/<tr>/g)).toHaveLength(3);
    expect(html.match(/<th /g)).toHaveLength(3);
  });

  it('adds and removes rows inside a table', () => {
    const target = create('<p></p>');
    runTableAction(target, INSERT_TABLE);
    runTableAction(target, tableAction('addRowAfter'));
    expect(target.getHTML().match(/<tr>/g)).toHaveLength(4);
    runTableAction(target, tableAction('deleteRow'));
    expect(target.getHTML().match(/<tr>/g)).toHaveLength(3);
  });

  it('deletes the whole table', () => {
    const target = create('<p></p>');
    runTableAction(target, INSERT_TABLE);
    runTableAction(target, tableAction('deleteTable'));
    expect(target.getHTML()).not.toContain('<table');
  });
});
