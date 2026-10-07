import { describe, expect, it } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import { editorFactory } from '../editor';
import { renderToolbar } from './render-toolbar';

const create = editorFactory();
const button = (name: string) => screen.getByRole('button', { name });

describe('Toolbar', () => {
  it('undoes and redoes the last change', () => {
    const editor = create('<p>Hello</p>');
    editor.commands.selectAll();
    renderToolbar(editor);
    expect(button('Undo')).toBeDisabled();
    expect(button('Redo')).toBeDisabled();

    fireEvent.click(button('Bold'));
    expect(editor.getHTML()).toContain('<strong>Hello</strong>');
    expect(button('Bold')).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(button('Undo'));
    expect(editor.getHTML()).not.toContain('<strong>');
    expect(button('Redo')).toBeEnabled();

    fireEvent.click(button('Redo'));
    expect(editor.getHTML()).toContain('<strong>Hello</strong>');
  });

  it('runs one-shot block commands without a pressed state', () => {
    const editor = create('<p>Hello</p>');
    renderToolbar(editor);
    expect(button('Divider')).not.toHaveAttribute('aria-pressed');
    expect(button('Bullet list')).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(button('Divider'));
    expect(editor.getHTML()).toContain('<hr>');
  });

  it('disables every formatting control while the HTML source is showing', () => {
    const editor = create('<p>Hello</p>');
    const { onToggleSource } = renderToolbar(editor, true);
    for (const name of [
      'Bold',
      'Align left',
      'Checklist',
      'Link',
      'Image',
      'Table',
      'Text colour',
    ]) {
      expect(button(name)).toBeDisabled();
    }
    expect(button('HTML source')).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(button('HTML source'));
    expect(onToggleSource).toHaveBeenCalledTimes(1);
  });

  it('hands the link and image buttons back to the editor', () => {
    const editor = create('<p>Hello</p>');
    const { onOpenLink, onOpenImage } = renderToolbar(editor);
    expect(button('Remove link')).toBeDisabled();
    fireEvent.click(button('Link'));
    fireEvent.click(button('Image'));
    expect(onOpenLink).toHaveBeenCalledTimes(1);
    expect(onOpenImage).toHaveBeenCalledTimes(1);
  });

  it('removes the whole link at the caret', () => {
    const editor = create('<p><a href="https://exyconn.com">site</a> after</p>');
    editor.commands.setTextSelection(3);
    renderToolbar(editor);
    expect(button('Link')).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(button('Remove link'));
    expect(editor.getHTML()).toMatch(/^<p>site after<\/p>/);
    expect(button('Remove link')).toBeDisabled();
  });

  it('follows the caret as it moves between formats', () => {
    const editor = create('<p><em>one</em> two</p>');
    editor.commands.setTextSelection(2);
    renderToolbar(editor);
    expect(button('Italic')).toHaveAttribute('aria-pressed', 'true');
    act(() => {
      editor.commands.setTextSelection(7);
    });
    expect(button('Italic')).toHaveAttribute('aria-pressed', 'false');
  });
});
