import { describe, expect, it, vi } from 'vitest';
import type { Editor } from '@tiptap/core';
import { Slice } from '@tiptap/pm/model';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RichTextEditor } from '../../../src';
import type { UploadImage } from '../../../src/types';
import { stubRangeGeometry } from '../dom-geometry';

stubRangeGeometry();

const HOSTED = 'https://ik.imagekit.io/x/pasted.png';

const mount = (props: { uploadImage?: UploadImage; onBlur?: () => void; value?: string } = {}) => {
  const onChange = vi.fn();
  render(
    <RichTextEditor
      label="Body"
      value={props.value ?? '<p>Hello</p>'}
      onChange={onChange}
      onBlur={props.onBlur}
      uploadImage={props.uploadImage ?? vi.fn(async () => HOSTED)}
    />,
  );
  const dom = screen.getByRole('textbox', { name: 'Body' }) as HTMLElement & { editor: Editor };
  return { onChange, dom, editor: dom.editor };
};

const png = (name: string) => new File(['x'], name, { type: 'image/png' });
const clipboard = (files: File[]) => ({ files, types: ['Files'], items: [], getData: () => '' });

/** Calls the editor's own drop handler, as ProseMirror does once it has a drop position. */
const drop = (editor: Editor, dataTransfer: { files: File[] } | null) => {
  const event = { dataTransfer, clientX: 4, clientY: 4 } as unknown as DragEvent;
  return editor.view.props.handleDrop?.(editor.view, event, Slice.empty, false);
};

describe('useRichTextEditor', () => {
  it('uploads a pasted image and inserts it at the caret, showing progress meanwhile', async () => {
    let finish: (url: string) => void = () => undefined;
    const uploadImage = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          finish = resolve;
        }),
    );
    const { dom, onChange } = mount({ uploadImage });

    fireEvent.paste(dom, { clipboardData: clipboard([png('team-photo.png')]) });
    expect(uploadImage).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('progressbar', { name: 'Uploading images' })).toBeInTheDocument();

    await act(async () => finish(HOSTED));
    expect(onChange).toHaveBeenLastCalledWith(
      expect.stringContaining(`<img src="${HOSTED}" alt="team photo">`),
    );
    expect(screen.queryByRole('progressbar', { name: 'Uploading images' })).not.toBeInTheDocument();
  });

  it('leaves a paste without images to the editor', () => {
    const uploadImage = vi.fn(async () => HOSTED);
    const { dom } = mount({ uploadImage });
    fireEvent.paste(dom, {
      clipboardData: clipboard([new File(['x'], 'a.txt', { type: 'text/plain' })]),
    });
    expect(uploadImage).not.toHaveBeenCalled();
  });

  it('inserts a dropped image where it was dropped', async () => {
    const { editor, onChange } = mount({ value: '<p>First</p><p>Second</p>' });
    const end = editor.state.doc.content.size;
    const posAtCoords = vi
      .spyOn(editor.view, 'posAtCoords')
      .mockReturnValue({ pos: end, inside: -1 });

    let handled: unknown;
    act(() => {
      handled = drop(editor, { files: [png('chart.png')] });
    });
    expect(handled).toBe(true);
    expect(posAtCoords).toHaveBeenCalledWith({ left: 4, top: 4 });
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const html = onChange.mock.lastCall?.[0] as string;
    expect(html.indexOf('Second')).toBeLessThan(html.indexOf('<img'));
  });

  it('inserts at the caret when the drop point is outside the document, and ignores empty drops', async () => {
    const { editor, onChange } = mount();
    vi.spyOn(editor.view, 'posAtCoords').mockReturnValue(null);
    expect(drop(editor, null)).toBe(false);
    act(() => {
      drop(editor, { files: [png('a.png')] });
    });
    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(expect.stringContaining('<img')));
  });

  it('shows a failed upload until it is dismissed', async () => {
    const { dom } = mount({
      uploadImage: vi.fn(async () => Promise.reject(new Error('Quota exceeded'))),
    });
    fireEvent.paste(dom, { clipboardData: clipboard([png('a.png')]) });
    expect(await screen.findByText(/Image upload failed: Quota exceeded/)).toBeInTheDocument();
    expect(screen.queryByRole('progressbar', { name: 'Uploading images' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByText(/Image upload failed/)).not.toBeInTheDocument();
  });

  it('reports a generic message when the failure is not an Error', async () => {
    const { dom } = mount({ uploadImage: () => Promise.reject(new Error('x').message) });
    fireEvent.paste(dom, { clipboardData: clipboard([png('a.png')]) });
    expect(await screen.findByText(/Image upload failed: Upload failed/)).toBeInTheDocument();
  });

  it('reports blur to the host', () => {
    const onBlur = vi.fn();
    const { dom } = mount({ onBlur });
    fireEvent.focus(dom);
    fireEvent.blur(dom);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('tolerates a host without a blur handler', () => {
    const { dom, onChange } = mount();
    fireEvent.focus(dom);
    expect(() => fireEvent.blur(dom)).not.toThrow();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('reports an emptied document as an empty string', () => {
    const { editor, onChange } = mount();
    act(() => {
      editor.commands.clearContent(true);
    });
    expect(onChange).toHaveBeenLastCalledWith('');
  });

  it('counts a single word and character in the singular', () => {
    mount({ value: '<p>a</p>' });
    expect(screen.getByText('1 word · 1 character')).toBeInTheDocument();
  });
});
