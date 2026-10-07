import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { UploadButton } from '../../../../src/forms/image/UploadButton';

const renderButton = (uploadImage: (file: File) => Promise<string>) => {
  const onUploaded = vi.fn();
  const onFailed = vi.fn();
  render(<UploadButton uploadImage={uploadImage} onUploaded={onUploaded} onFailed={onFailed} />);
  const input = screen.getByLabelText<HTMLInputElement>('Image file');
  return { onUploaded, onFailed, input };
};

const file = new File(['x'], 'a.png', { type: 'image/png' });

describe('UploadButton', () => {
  it('shows progress while uploading and reports the URL', async () => {
    let resolve: (url: string) => void = () => undefined;
    const uploadImage = vi.fn(
      () =>
        new Promise<string>((done) => {
          resolve = done;
        }),
    );
    const { onUploaded, onFailed, input } = renderButton(uploadImage);
    expect(input).toHaveAttribute('accept', 'image/*');

    fireEvent.change(input, { target: { files: [file] } });
    expect(screen.getByText('Uploading…')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    await act(async () => resolve('https://x.test/a.png'));
    expect(onUploaded).toHaveBeenCalledWith('https://x.test/a.png', file);
    expect(onFailed).not.toHaveBeenCalled();
    expect(screen.getByText('Upload from device')).toBeInTheDocument();
    // The picker is cleared, so the same file can be chosen again.
    expect(input.value).toBe('');
  });

  it('does nothing when the picker is closed without a file', () => {
    const uploadImage = vi.fn(async () => 'unused');
    const { onUploaded, input } = renderButton(uploadImage);
    fireEvent.change(input, { target: { files: [] } });
    expect(uploadImage).not.toHaveBeenCalled();
    expect(onUploaded).not.toHaveBeenCalled();
  });

  it('reports the error message of a failed upload', async () => {
    const { onFailed, onUploaded, input } = renderButton(async () => {
      throw new Error('Quota exceeded');
    });
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });
    expect(onFailed).toHaveBeenCalledWith('Quota exceeded');
    expect(onUploaded).not.toHaveBeenCalled();
    expect(screen.getByText('Upload from device')).toBeInTheDocument();
  });

  it('reports a generic message when the failure is not an Error', async () => {
    const { onFailed, input } = renderButton(() => Promise.reject(new Error('x').message));
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });
    expect(onFailed).toHaveBeenCalledWith('Upload failed');
  });
});
