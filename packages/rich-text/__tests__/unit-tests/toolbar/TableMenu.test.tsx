import { describe, expect, it } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { TABLE_ACTIONS } from '../../../src/toolbar/table-actions';
import { editorFactory } from '../editor';
import { renderToolbar } from './render-toolbar';

const create = editorFactory();

const openTableMenu = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Table' }));
  return screen.findByRole('menu');
};

const TABLE =
  '<table><tbody><tr><th><p>a</p></th><th><p>b</p></th></tr><tr><td><p>c</p></td><td><p>d</p></td></tr></tbody></table>';

describe('TableMenu', () => {
  it('offers only an insert outside a table, and inserts one', async () => {
    const editor = create('<p></p>');
    renderToolbar(editor);
    expect(screen.getByRole('button', { name: 'Table' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Table' })).toHaveAttribute('aria-haspopup', 'menu');

    const menu = await openTableMenu();
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((item) => item.textContent),
    ).toEqual(['Insert table (3 × 3)']);
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Insert table (3 × 3)' }));
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(editor.getHTML().match(/<tr>/g)).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Table' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('lists the table operations in groups inside a table, disabling those that cannot apply', async () => {
    const editor = create(TABLE);
    editor.commands.setTextSelection(3);
    renderToolbar(editor);

    const menu = await openTableMenu();
    const items = within(menu).getAllByRole('menuitem');
    expect(items.map((item) => item.textContent)).toEqual(
      TABLE_ACTIONS.map((action) => action.label),
    );
    expect(within(menu).getAllByRole('separator')).toHaveLength(
      TABLE_ACTIONS.filter((action) => action.startsGroup).length,
    );
    expect(within(menu).getByRole('menuitem', { name: 'Merge cells' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(within(menu).getByRole('menuitem', { name: 'Insert row below' })).not.toHaveAttribute(
      'aria-disabled',
    );

    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Insert row below' }));
    expect(editor.getHTML().match(/<tr>/g)).toHaveLength(3);
  });

  it('closes without running anything when dismissed', async () => {
    const editor = create(TABLE);
    editor.commands.setTextSelection(3);
    renderToolbar(editor);
    await openTableMenu();
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(editor.getHTML().match(/<tr>/g)).toHaveLength(2);
  });
});
