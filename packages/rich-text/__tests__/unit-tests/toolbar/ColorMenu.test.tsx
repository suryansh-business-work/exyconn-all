import { describe, expect, it } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { HIGHLIGHT_SWATCHES, TEXT_SWATCHES } from '../../../src/toolbar/color-palette';
import { editorFactory } from '../editor';
import { renderToolbar } from './render-toolbar';

const create = editorFactory();

const open = async (name: string) => {
  fireEvent.click(screen.getByRole('button', { name }));
  return screen.findByRole('menu');
};

const swatch = (swatches: typeof TEXT_SWATCHES, label: string) =>
  swatches.find((candidate) => candidate.label === label)?.value ?? '';

describe('ColorMenu', () => {
  it('colours the selection and marks the colour in use', async () => {
    const editor = create('<p>Hello</p>');
    editor.commands.selectAll();
    renderToolbar(editor);
    expect(screen.getByRole('button', { name: 'Text colour' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    const menu = await open('Text colour');
    expect(within(menu).getAllByRole('button', { pressed: false })).toHaveLength(
      TEXT_SWATCHES.length,
    );
    fireEvent.click(within(menu).getByRole('button', { name: 'Blue' }));
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(editor.getAttributes('textStyle').color).toBe(swatch(TEXT_SWATCHES, 'Blue'));
    expect(editor.getHTML()).toContain('<span style="color:');
    expect(screen.getByRole('button', { name: 'Text colour' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    const reopened = await open('Text colour');
    expect(within(reopened).getByRole('button', { name: 'Blue' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('removes the text colour', async () => {
    const editor = create(
      `<p><span style="color: ${swatch(TEXT_SWATCHES, 'Red')}">Hello</span></p>`,
    );
    editor.commands.selectAll();
    renderToolbar(editor);
    const menu = await open('Text colour');
    fireEvent.click(within(menu).getByRole('button', { name: /Remove text colour/ }));
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(editor.getHTML()).not.toContain('color:');
  });

  it('highlights the selection and removes the highlight', async () => {
    const editor = create('<p>Hello</p>');
    editor.commands.selectAll();
    renderToolbar(editor);
    const menu = await open('Highlight');
    fireEvent.click(within(menu).getByRole('button', { name: 'Yellow' }));
    expect(editor.getHTML()).toContain(`data-color="${swatch(HIGHLIGHT_SWATCHES, 'Yellow')}"`);

    const again = await open('Highlight');
    fireEvent.click(within(again).getByRole('button', { name: /Remove highlight/ }));
    expect(editor.getHTML()).not.toContain('<mark');
  });

  it('closes without changing anything when dismissed', async () => {
    const editor = create('<p>Hello</p>');
    renderToolbar(editor);
    await open('Highlight');
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(editor.getHTML()).toMatch(/^<p>Hello<\/p>/);
  });
});
