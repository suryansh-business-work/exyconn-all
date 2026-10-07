import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MediaUploadButton } from '../../../../../src/pages/cms/media/MediaUploadButton';
import { renderWithProviders } from '../../../test-utils';

const spies = vi.hoisted(() => ({ upload: vi.fn(), onUploaded: vi.fn() }));

vi.mock('../../../../../src/pages/cms/media/useMediaUpload', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useMediaUpload: () => spies.upload,
}));

const png = new File(['a'], 'logo.png', { type: 'image/png' });
const pdf = new File(['b'], 'brochure.pdf', { type: 'application/pdf' });

function renderButton() {
  const { container } = renderWithProviders(
    <MediaUploadButton siteId="site-1" onUploaded={spies.onUploaded} />,
  );
  return container.querySelector('input[type="file"]') as HTMLInputElement;
}

const pick = (input: HTMLInputElement, files: File[] | null) =>
  fireEvent.change(input, { target: { files } });

describe('MediaUploadButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    spies.upload.mockImplementation((file: File) => Promise.resolve(`https://cdn/${file.name}`));
  });

  it('takes several images or PDFs through a hidden picker opened by the button', async () => {
    const input = renderButton();
    const click = vi.spyOn(input, 'click');

    expect(input).toHaveAttribute('accept', 'image/*,application/pdf');
    expect(input.multiple).toBe(true);
    await userEvent.click(screen.getByRole('button', { name: 'Upload' }));
    expect(click).toHaveBeenCalledTimes(1);
  });

  it('uploads every picked file and hands over their URLs', async () => {
    pick(renderButton(), [png, pdf]);

    await waitFor(() =>
      expect(spies.onUploaded).toHaveBeenCalledWith([
        'https://cdn/logo.png',
        'https://cdn/brochure.pdf',
      ]),
    );
    expect(spies.upload).toHaveBeenCalledTimes(2);
    expect(await screen.findByText('2 file(s) uploaded')).toBeInTheDocument();
  });

  it('shows the batch is busy until it settles', async () => {
    let finish: (url: string) => void = () => undefined;
    spies.upload.mockReturnValueOnce(
      new Promise<string>((resolve) => {
        finish = resolve;
      }),
    );
    pick(renderButton(), [png]);

    expect(await screen.findByRole('button', { name: 'Uploading…' })).toBeDisabled();
    finish('https://cdn/logo.png');
    expect(await screen.findByRole('button', { name: 'Upload' })).toBeEnabled();
  });

  it('says why a file failed and hands over only the ones that went up', async () => {
    spies.upload.mockRejectedValueOnce(new Error('logo.png is larger than 12 MB'));
    pick(renderButton(), [png]);

    expect(
      await screen.findByText('Upload failed: logo.png is larger than 12 MB'),
    ).toBeInTheDocument();
    expect(spies.onUploaded).toHaveBeenCalledWith([]);
  });

  it('reports a failure without a reason', async () => {
    spies.upload.mockRejectedValueOnce('offline');
    pick(renderButton(), [png]);
    expect(await screen.findByText('Upload failed:')).toBeInTheDocument();
  });

  it('does nothing when the picker is closed without a file', () => {
    pick(renderButton(), []);
    pick(renderButton(), null);
    expect(spies.upload).not.toHaveBeenCalled();
    expect(spies.onUploaded).not.toHaveBeenCalled();
  });

  it('reports what went wrong after the upload', async () => {
    spies.onUploaded.mockImplementationOnce(() => {
      throw new Error('Reload broke');
    });
    pick(renderButton(), [png]);
    expect(await screen.findByText('Reload broke')).toBeInTheDocument();
  });

  it('falls back to a generic message when that failure has no reason', async () => {
    const notAnError: unknown = { code: 'OFFLINE' };
    spies.onUploaded.mockImplementationOnce(() => {
      throw notAnError;
    });
    pick(renderButton(), [png]);
    expect(await screen.findByText('Upload failed')).toBeInTheDocument();
  });
});
