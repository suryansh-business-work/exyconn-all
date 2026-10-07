import { describe, expect, it } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import { editorFactory } from '../editor';
import { renderToolbar } from './render-toolbar';

const create = editorFactory();

const choose = async (picker: string, option: string) => {
  fireEvent.mouseDown(screen.getByRole('combobox', { name: picker }));
  const listbox = await screen.findByRole('listbox');
  fireEvent.click(within(listbox).getByRole('option', { name: option }));
};

describe('font pickers', () => {
  it('sets and then clears the font family of the selection', async () => {
    const editor = create('<p>Hello</p>');
    editor.commands.selectAll();
    renderToolbar(editor);
    expect(screen.getByRole('combobox', { name: 'Font' })).toHaveTextContent('Default font');

    await choose('Font', 'Georgia');
    expect(editor.getHTML()).toContain('font-family: Georgia, serif');
    expect(screen.getByRole('combobox', { name: 'Font' })).toHaveTextContent('Georgia');

    await choose('Font', 'Default font');
    expect(editor.getHTML()).not.toContain('font-family');
  });

  it('sets and then clears the font size of the selection', async () => {
    const editor = create('<p>Hello</p>');
    editor.commands.selectAll();
    renderToolbar(editor);

    await choose('Font size', '18');
    expect(editor.getHTML()).toContain('font-size: 18px');

    await choose('Font size', 'Default size');
    expect(editor.getHTML()).not.toContain('font-size');
  });

  it('shows a face that is not in the list as the default', () => {
    const editor = create('<p><span style="font-family: Papyrus">Hello</span></p>');
    editor.commands.setTextSelection(2);
    renderToolbar(editor);
    expect(screen.getByRole('combobox', { name: 'Font' })).toHaveTextContent('Default font');
  });
});

describe('block type picker', () => {
  it('turns the caret block into a heading', async () => {
    const editor = create('<p>Hello</p>');
    editor.commands.setTextSelection(2);
    renderToolbar(editor);
    expect(screen.getByRole('combobox', { name: 'Block type' })).toHaveTextContent('Paragraph');

    await choose('Block type', 'Heading 2');
    expect(editor.getHTML()).toMatch(/^<h2>Hello<\/h2>/);
    expect(screen.getByRole('combobox', { name: 'Block type' })).toHaveTextContent('Heading 2');
  });

  it('shows a selection across different blocks as mixed', () => {
    const editor = create('<h1>One</h1><p>Two</p>');
    editor.commands.selectAll();
    renderToolbar(editor);
    expect(screen.getByRole('combobox', { name: 'Block type' })).toHaveTextContent('Mixed');
  });
});
