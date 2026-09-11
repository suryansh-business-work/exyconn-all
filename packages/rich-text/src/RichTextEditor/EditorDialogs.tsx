import type { Editor } from '@tiptap/core';
import { ImageForm, type ImageFormValues } from '../forms/image';
import { LinkForm, type LinkFormValues } from '../forms/link';
import type { UploadImage } from '../types';

export type EditorDialog = 'link' | 'image' | null;

interface EditorDialogsProps {
  editor: Editor;
  dialog: EditorDialog;
  uploadImage: UploadImage;
  onClose: () => void;
}

const NEW_TAB = '_blank';

/** The link on the selection, for the dialog to edit. */
const currentLink = (editor: Editor): LinkFormValues => {
  const { href, target } = editor.getAttributes('link');
  return { href: href ?? '', openInNewTab: target === NEW_TAB };
};

const applyLink = (editor: Editor, values: LinkFormValues) => {
  const attrs = { href: values.href, target: values.openInNewTab ? NEW_TAB : null };
  const chain = editor.chain().focus().extendMarkRange('link');
  // With nothing selected there is no text to wrap, so the address becomes the text.
  if (editor.state.selection.empty && !editor.isActive('link')) {
    chain
      .insertContent({ type: 'text', text: values.href, marks: [{ type: 'link', attrs }] })
      .run();
    return;
  }
  chain.setLink(attrs).run();
};

const applyImage = (editor: Editor, values: ImageFormValues) => {
  editor
    .chain()
    .focus()
    .setImage({ src: values.src, alt: values.alt, title: values.title || undefined })
    .run();
};

/** Mounts whichever dialog is open; each is created fresh so it starts from the selection. */
export function EditorDialogs({
  editor,
  dialog,
  uploadImage,
  onClose,
}: Readonly<EditorDialogsProps>) {
  const submit =
    <TValues,>(apply: (target: Editor, values: TValues) => void) =>
    (values: TValues) => {
      apply(editor, values);
      onClose();
    };

  if (dialog === 'link') {
    return (
      <LinkForm initial={currentLink(editor)} onSubmit={submit(applyLink)} onClose={onClose} />
    );
  }
  if (dialog === 'image') {
    return <ImageForm uploadImage={uploadImage} onSubmit={submit(applyImage)} onClose={onClose} />;
  }
  return null;
}
