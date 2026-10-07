import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import { fileToDataUrl } from '@exyconn/shell/utils/file';
import { useChatAttachments } from '../../../../../../src/pages/chat/forms/chat-reply/useChatAttachments';
import { renderHookWithProviders } from '../../../../test-utils';

vi.mock('@exyconn/shell/utils/file', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/utils/file')>()),
  fileToDataUrl: vi.fn(),
}));

const MB = 1024 * 1024;

function picked(name: string, type: string, size = 10): File {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

function renderAttachments(maxUploadMb = 2) {
  return renderHookWithProviders(() => useChatAttachments(maxUploadMb)).result;
}

describe('useChatAttachments', () => {
  beforeEach(() => {
    vi.mocked(fileToDataUrl)
      .mockReset()
      .mockImplementation((file: File) => Promise.resolve(`data:${file.type};base64,AAAA`));
  });

  it('reads pictures and clips into data URLs, each with its own id', async () => {
    const result = renderAttachments();
    act(() =>
      result.current.pick([picked('a.png', 'image/png', 20), picked('b.mp4', 'video/mp4')]),
    );

    await waitFor(() => expect(result.current.files).toHaveLength(2));
    const [first, second] = result.current.files;
    expect(first).toMatchObject({ name: 'a.png', data: 'data:image/png;base64,AAAA', size: 20 });
    expect(second.name).toBe('b.mp4');
    expect(first.id).not.toBe(second.id);
    expect(result.current.canAddMore).toBe(true);
  });

  it('turns away anything that is not a picture or a video', async () => {
    const result = renderAttachments();
    act(() =>
      result.current.pick([picked('notes.pdf', 'application/pdf'), picked('c.jpg', 'image/jpeg')]),
    );

    expect(await screen.findByText('Attach a picture or a video')).toBeInTheDocument();
    await waitFor(() => expect(result.current.files.map((file) => file.name)).toEqual(['c.jpg']));
  });

  it('turns away a file over the size limit, naming it', async () => {
    const result = renderAttachments(2);
    act(() => result.current.pick([picked('huge.mov', 'video/quicktime', 2 * MB + 1)]));

    expect(await screen.findByText('huge.mov is larger than 2 MB')).toBeInTheDocument();
    expect(result.current.files).toEqual([]);
  });

  it('accepts a file exactly at the size limit', async () => {
    const result = renderAttachments(2);
    act(() => result.current.pick([picked('edge.png', 'image/png', 2 * MB)]));
    await waitFor(() => expect(result.current.files).toHaveLength(1));
  });

  it('allows at most four files with one message', async () => {
    const result = renderAttachments();
    const five = ['1', '2', '3', '4', '5'].map((n) => picked(`${n}.png`, 'image/png'));
    act(() => result.current.pick(five));

    expect(await screen.findByText('Send at most 4 files with one message')).toBeInTheDocument();
    expect(fileToDataUrl).not.toHaveBeenCalled();

    act(() => result.current.pick(five.slice(0, 4)));
    await waitFor(() => expect(result.current.files).toHaveLength(4));
    expect(result.current.canAddMore).toBe(false);
  });

  it('caps recorded voice notes at four too', () => {
    const result = renderAttachments();
    act(() => {
      for (const id of ['v1', 'v2', 'v3', 'v4', 'v5']) {
        result.current.add({ id, name: `${id}.webm`, data: 'data:audio/webm;base64,AA', size: 1 });
      }
    });
    expect(result.current.files.map((file) => file.id)).toEqual(['v1', 'v2', 'v3', 'v4']);
  });

  it('says so when a file cannot be read', async () => {
    vi.mocked(fileToDataUrl).mockRejectedValue(new Error('The file is locked'));
    const result = renderAttachments();
    act(() => result.current.pick([picked('a.png', 'image/png')]));

    expect(await screen.findByText('The file is locked')).toBeInTheDocument();
    expect(result.current.files).toEqual([]);
  });

  it('removes one file, or all of them once the reply is sent', () => {
    const result = renderAttachments();
    act(() => {
      result.current.add({ id: 'a', name: 'a.png', data: 'data:image/png;base64,AA', size: 1 });
      result.current.add({ id: 'b', name: 'b.png', data: 'data:image/png;base64,AA', size: 1 });
    });
    act(() => result.current.remove('a'));
    expect(result.current.files.map((file) => file.id)).toEqual(['b']);

    act(() => result.current.clear());
    expect(result.current.files).toEqual([]);
  });
});
