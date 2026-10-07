import type { ChangeEvent } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import { useAttachmentUpload } from '../../../../../src/pages/projects/attachments';
import { renderHookWithProviders } from '../../../test-utils';

const gql = vi.hoisted(() => ({ upload: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useUploadImageMutation: () => [gql.upload],
}));

vi.mock('@exyconn/shell/utils/file', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/utils/file')>()),
  fileToDataUrl: (file: File) => Promise.resolve(`data:${file.type};base64,AAAA`),
}));

/** A change event from the file input carrying `files`, as the browser sends it. */
function changeEvent(files: File[]) {
  const target = { files, value: 'previous.png' };
  return { event: { target } as unknown as ChangeEvent<HTMLInputElement>, target };
}

function sizedFile(name: string, type: string, size: number) {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

const onUploaded = vi.fn();

const setup = () => renderHookWithProviders(() => useAttachmentUpload(onUploaded));

describe('useAttachmentUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.upload.mockResolvedValue({ data: { uploadImage: 'https://ik.example/shot.png' } });
    onUploaded.mockResolvedValue(undefined);
  });

  it('uploads a picked image to the attachments folder and hands back its URL', async () => {
    const { result } = setup();
    const { event, target } = changeEvent([sizedFile('shot.png', 'image/png', 1024)]);

    await act(() => result.current.pick(event));

    expect(target.value).toBe('');
    expect(gql.upload).toHaveBeenCalledWith({
      variables: {
        file: 'data:image/png;base64,AAAA',
        fileName: 'shot.png',
        folder: 'ticket-attachments',
      },
    });
    expect(onUploaded).toHaveBeenCalledWith({
      url: 'https://ik.example/shot.png',
      name: 'shot.png',
      contentType: 'image/png',
    });
    expect(result.current.uploading).toBe(false);
  });

  it('does nothing when the picker is closed without a file', async () => {
    const { result } = setup();

    await act(() => result.current.pick(changeEvent([]).event));

    expect(gql.upload).not.toHaveBeenCalled();
  });

  it('refuses a file that is neither an image nor a PDF', async () => {
    const { result } = setup();

    await act(() =>
      result.current.pick(changeEvent([sizedFile('a.zip', 'application/zip', 10)]).event),
    );

    expect(await screen.findByText('Images or PDF · up to 5 MB each')).toBeInTheDocument();
    expect(gql.upload).not.toHaveBeenCalled();
  });

  it('refuses a file over 5 MB', async () => {
    const { result } = setup();
    const big = sizedFile('scan.pdf', 'application/pdf', 5 * 1024 * 1024 + 1);

    await act(() => result.current.pick(changeEvent([big]).event));

    expect(await screen.findByText('Images or PDF · up to 5 MB each')).toBeInTheDocument();
    expect(gql.upload).not.toHaveBeenCalled();
  });

  it('accepts a file of exactly 5 MB', async () => {
    const { result } = setup();
    const edge = sizedFile('scan.pdf', 'application/pdf', 5 * 1024 * 1024);

    await act(() => result.current.pick(changeEvent([edge]).event));

    expect(gql.upload).toHaveBeenCalledTimes(1);
  });

  it('reports an upload that came back without a URL', async () => {
    gql.upload.mockResolvedValueOnce({ data: { uploadImage: '' } });
    const { result } = setup();

    await act(() => result.current.pick(changeEvent([sizedFile('a.png', 'image/png', 1)]).event));

    expect(await screen.findByText('Upload returned no URL')).toBeInTheDocument();
    expect(onUploaded).not.toHaveBeenCalled();
    expect(result.current.uploading).toBe(false);
  });

  it('reports a failed upload in general terms when the error says nothing', async () => {
    gql.upload.mockRejectedValueOnce('offline');
    const { result } = setup();

    await act(() => result.current.pick(changeEvent([sizedFile('a.png', 'image/png', 1)]).event));

    expect(await screen.findByText('Upload failed')).toBeInTheDocument();
  });

  it('ignores a second file while the first is still uploading', async () => {
    let finish: (value: unknown) => void = () => undefined;
    gql.upload.mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const { result } = setup();
    let first: Promise<void> = Promise.resolve();
    act(() => {
      first = result.current.pick(changeEvent([sizedFile('a.png', 'image/png', 1)]).event);
    });
    await vi.waitFor(() => expect(result.current.uploading).toBe(true));

    await act(() => result.current.pick(changeEvent([sizedFile('b.png', 'image/png', 1)]).event));
    expect(gql.upload).toHaveBeenCalledTimes(1);

    await act(async () => {
      finish({ data: { uploadImage: 'https://ik.example/a.png' } });
      await first;
    });
    expect(onUploaded).toHaveBeenCalledTimes(1);
    expect(result.current.uploading).toBe(false);
  });

  it('opens the browser file picker through the input it is attached to', () => {
    const { result } = setup();
    const input = document.createElement('input');
    const click = vi.spyOn(input, 'click').mockImplementation(() => undefined);

    result.current.open();
    expect(click).not.toHaveBeenCalled();

    result.current.inputRef.current = input;
    result.current.open();
    expect(click).toHaveBeenCalledTimes(1);
  });
});
