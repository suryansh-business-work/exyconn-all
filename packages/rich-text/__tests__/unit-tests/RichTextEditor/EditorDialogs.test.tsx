import { afterEach, describe, expect, it, vi } from 'vitest';
import { Editor } from '@tiptap/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { buildExtensions } from '../../../src/extensions';
import { EditorDialogs, type EditorDialog } from '../../../src/RichTextEditor/EditorDialogs';

let editor: Editor | null = null;

const setup = (content: string, dialog: EditorDialog) => {
  editor = new Editor({ extensions: buildExtensions(''), content });
  const onClose = vi.fn();
  const uploadImage = vi.fn(async () => 'https://x.test/a.png');
  const view = render(
    <EditorDialogs editor={editor} dialog={dialog} uploadImage={uploadImage} onClose={onClose} />,
  );
  return { target: editor, onClose, view };
};

afterEach(() => {
  editor?.destroy();
  editor = null;
});

const type = (name: string, value: string) =>
  fireEvent.change(screen.getByRole('textbox', { name }), { target: { value } });

describe('EditorDialogs', () => {
  it('renders nothing when no dialog is open', () => {
    const { view } = setup('<p>Hello</p>', null);
    expect(view.container).toBeEmptyDOMElement();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('inserts the address as linked text when nothing is selected', async () => {
    const { target, onClose } = setup('<p>Hello</p>', 'link');
    type('URL', 'https://exyconn.com');
    fireEvent.click(screen.getByRole('switch', { name: 'Open in a new tab' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(target.getHTML()).toContain('target="_blank"');
    expect(target.getHTML()).toContain('href="https://exyconn.com"');
    expect(target.getText()).toContain('https://exyconn.com');
  });

  it('links the selected text, in the same tab', async () => {
    const { target, onClose } = setup('<p>Hello world</p>', 'link');
    target.commands.setTextSelection({ from: 1, to: 6 });
    type('URL', '/about');
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(target.getHTML()).toMatch(/<a [^>]*href="\/about"[^>]*>Hello<\/a> world/);
    expect(target.getHTML()).not.toContain('target=');
  });

  it('edits the link at the caret, starting from its address and tab setting', async () => {
    editor = new Editor({
      extensions: buildExtensions(''),
      content: '<p><a href="https://old.test" target="_blank">site</a> after</p>',
    });
    editor.commands.setTextSelection(3);
    const onClose = vi.fn();
    render(<EditorDialogs editor={editor} dialog="link" uploadImage={vi.fn()} onClose={onClose} />);
    expect(screen.getByRole('dialog', { name: 'Edit link' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'URL' })).toHaveValue('https://old.test');
    expect(screen.getByRole('switch', { name: 'Open in a new tab' })).toBeChecked();

    type('URL', 'https://new.test');
    fireEvent.click(screen.getByRole('button', { name: 'Update' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(editor.getHTML()).toMatch(/<a [^>]*href="https:\/\/new.test"[^>]*>site<\/a> after/);
    expect(editor.getText()).not.toContain('https://new.test');
  });

  it('inserts an image with its title', async () => {
    const { target, onClose } = setup('<p>Hello</p>', 'image');
    type('Image URL', 'https://x.test/a.png');
    type('Alt text', 'A chart');
    type('Title (optional)', 'Growth');
    fireEvent.click(screen.getByRole('button', { name: 'Insert' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(target.getHTML()).toContain(
      '<img src="https://x.test/a.png" alt="A chart" title="Growth">',
    );
  });

  it('leaves the title off an image inserted without one', async () => {
    const { target, onClose } = setup('<p>Hello</p>', 'image');
    type('Image URL', 'https://x.test/b.png');
    type('Alt text', 'A photo');
    fireEvent.click(screen.getByRole('button', { name: 'Insert' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(target.getHTML()).toContain('<img src="https://x.test/b.png" alt="A photo">');
  });
});
