import { describe, expect, it } from 'vitest';
import { COMPONENT_TYPE, FRAGMENT_TYPE } from '../../../src/cms';
import { EMBED_TYPE } from '../../../src/cms/embed-type';
import { EDIT_PROPS_COMMAND } from '../../../src/cms/component-types';
import { cmsEditor } from './cms-fixtures';

describe('cmsEditorPlugin', () => {
  it('registers the placeholder and embed types and the edit command', () => {
    const { editor } = cmsEditor('');
    for (const type of [COMPONENT_TYPE, FRAGMENT_TYPE, EMBED_TYPE]) {
      expect(editor.DomComponents.getType(type)).toBeDefined();
    }
    expect(editor.Commands.has(EDIT_PROPS_COMMAND)).toBe(true);
  });

  it('adds Undo and Redo buttons to the canvas toolbar, wired to the history', () => {
    const { editor } = cmsEditor('');
    const undo = editor.Panels.getButton('options', 'exy-undo');
    const redo = editor.Panels.getButton('options', 'exy-redo');
    expect(undo?.get('command')).toBe('core:undo');
    expect(redo?.get('command')).toBe('core:redo');
    expect(undo?.get('attributes')).toEqual({ title: 'Undo' });
    expect(redo?.get('attributes')).toEqual({ title: 'Redo' });
    expect(undo?.get('togglable')).toBe(false);
    expect(undo?.get('label')).toContain('width:18px;height:18px');
  });
});
