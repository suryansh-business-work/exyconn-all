import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { editorProps, liveEditor } from './live-editor-stub';
import { INITIAL, PAGE_URL, renderLiveEditScreen } from './live-edit-screen-harness';

const env = vi.hoisted(() => ({
  small: false,
  folder: '',
  upload: vi.fn((file: File) => Promise.resolve(`https://ik.example.test/${file.name}`)),
}));

vi.mock('@exyconn/live-editor', async () => {
  const stub = await import('./live-editor-stub');
  return { LiveEditor: stub.LiveEditorStub };
});

vi.mock('@exyconn/shell/hooks/useImageKitUpload', () => ({
  useImageKitUpload: (folder: string) => {
    env.folder = folder;
    return env.upload;
  },
}));

vi.mock('@exyconn/shell/components/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@exyconn/shell/components/ui')>();
  return { ...actual, useMediaQuery: () => env.small };
});

const saveButton = () => screen.getByRole('button', { name: 'Save' });
const makeChange = () => fireEvent.click(screen.getByRole('button', { name: 'Change the design' }));
const goBack = () => fireEvent.click(screen.getByRole('button', { name: 'Back to the list' }));

function unloadPrevented(): boolean {
  const event = new Event('beforeunload', { cancelable: true });
  globalThis.dispatchEvent(event);
  return event.defaultPrevented;
}

beforeEach(() => {
  env.small = false;
  env.folder = '';
  liveEditor.props = null;
  liveEditor.attached = true;
});

describe('LiveEditScreen', () => {
  it('opens the body on a canvas styled like the live article', () => {
    renderLiveEditScreen();
    const props = editorProps();
    expect(props.initial).toBe(INITIAL);
    expect(props.canvasStyles).toEqual(['https://exyconn.com/styles/article-canvas.css']);
    expect(props.canvasClass).toBe('article-body');
    expect(props.uploadImage).toBe(env.upload);
    expect(env.folder).toBe('website/blog');
    expect(screen.getByText('Why agents fail')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View on site' })).toHaveAttribute('href', PAGE_URL);
    expect(screen.getByText('All changes saved')).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
  });

  it('saves the editor’s design and reports it live', async () => {
    const onSave = renderLiveEditScreen();
    makeChange();
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    expect(unloadPrevented()).toBe(true);

    fireEvent.click(saveButton());

    expect(
      await screen.findByText('Saved — the page shows the new design now'),
    ).toBeInTheDocument();
    expect(onSave).toHaveBeenCalledWith(liveEditor.design);
    expect(screen.getByText('All changes saved')).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
    expect(unloadPrevented()).toBe(false);
  });

  it('shows the save in progress until the server answers', async () => {
    let finish: (value: unknown) => void = () => undefined;
    const pending = new Promise((resolve) => {
      finish = resolve;
    });
    renderLiveEditScreen(vi.fn(() => pending));
    makeChange();
    fireEvent.click(saveButton());

    expect(await screen.findByRole('button', { name: 'Saving…' })).toBeDisabled();
    finish({});
    expect(await screen.findByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('keeps the work unsaved and says why when the save fails', async () => {
    renderLiveEditScreen(vi.fn(() => Promise.reject(new Error('Slug already taken'))));
    makeChange();
    fireEvent.click(saveButton());

    expect(await screen.findByText('Slug already taken')).toBeInTheDocument();
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    expect(saveButton()).toBeEnabled();
  });

  it('does not save before the editor is ready', async () => {
    liveEditor.attached = false;
    const onSave = renderLiveEditScreen();
    makeChange();
    fireEvent.click(saveButton());

    await waitFor(() => expect(saveButton()).toBeEnabled());
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
  });

  it('goes straight back to the list when nothing is unsaved', async () => {
    renderLiveEditScreen();
    goBack();
    expect(await screen.findByText('Blog list')).toBeInTheDocument();
    expect(screen.queryByText('Leave without saving?')).not.toBeInTheDocument();
  });

  it('asks before leaving unsaved work, and stays when told to', async () => {
    renderLiveEditScreen();
    makeChange();
    goBack();
    expect(await screen.findByText('Leave without saving?')).toBeInTheDocument();
    expect(
      screen.getByText('Your changes to this page have not been saved and will be lost.'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.queryByText('Blog list')).not.toBeInTheDocument();

    goBack();
    fireEvent.click(await screen.findByRole('button', { name: 'Leave' }));
    expect(await screen.findByText('Blog list')).toBeInTheDocument();
  });

  it('shows a failed upload from the canvas', async () => {
    renderLiveEditScreen();
    fireEvent.click(screen.getByRole('button', { name: 'Fail an upload' }));
    expect(await screen.findByText('Upload failed: too large')).toBeInTheDocument();
  });

  it('sends a phone to a bigger screen with a way back', async () => {
    env.small = true;
    renderLiveEditScreen();
    expect(screen.getByText('Live editing needs a bigger screen')).toBeInTheDocument();
    expect(liveEditor.props).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(await screen.findByText('Blog list')).toBeInTheDocument();
  });
});
