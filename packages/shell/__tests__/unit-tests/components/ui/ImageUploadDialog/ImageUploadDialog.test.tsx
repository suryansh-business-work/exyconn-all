import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockLink } from '@apollo/client/testing';
import * as crop from '@/components/ui/ImageUploadDialog/crop-image';
import { SearchPexelsPhotosDocument } from '@/graphql/generated';
import { ImageUploadDialog } from '@/components/ui';
import { renderWithProviders } from '../../../test-utils';
import { dataUrlOf, uploadMock } from './mediaHarness';
import { pexelsItem } from './fixtures';

vi.mock('react-easy-crop', () => ({
  default: ({ onCropComplete }: Readonly<{ onCropComplete: (a: object, p: object) => void }>) => (
    <button type="button" onClick={() => onCropComplete({}, { x: 1, y: 1, width: 5, height: 5 })}>
      frame it
    </button>
  ),
}));

const CDN = 'https://ik.imagekit.io/exyconn/logo.png';

function renderDialog(
  props: { media?: 'image' | 'all'; folder?: string } = {},
  mocks: MockLink.MockedResponse[] = [],
) {
  const onClose = vi.fn();
  const onUploaded = vi.fn();
  renderWithProviders(
    <ImageUploadDialog
      open
      title="Logo"
      currentUrl={null}
      onClose={onClose}
      onUploaded={onUploaded}
      {...props}
    />,
    { mocks },
  );
  return { onClose, onUploaded };
}

const pickDeviceFile = (file: File) =>
  fireEvent.change(screen.getByTestId('image-upload-input'), { target: { files: [file] } });

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('ImageUploadDialog', () => {
  it('offers the device, stock photo and stock video sources by default', async () => {
    renderWithProviders(<ImageUploadDialog open onClose={vi.fn()} onUploaded={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Upload' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Choose image' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Pexels images' }));
    expect(screen.getByRole('textbox', { name: 'Search Pexels photos' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Pexels videos' }));
    expect(screen.getByRole('textbox', { name: 'Search Pexels videos' })).toBeInTheDocument();
  });

  it('leaves the video source out of an image-only field', () => {
    renderDialog({ media: 'image' });

    expect(screen.queryByRole('tab', { name: 'Pexels videos' })).not.toBeInTheDocument();
  });

  it('reviews a picked vector, uploads it and closes', async () => {
    const svg = new File(['<svg/>'], 'mark.svg', { type: 'image/svg+xml' });
    const { onClose, onUploaded } = renderDialog({ folder: 'branding' }, [
      uploadMock(
        { file: dataUrlOf('image/svg+xml', '<svg/>'), fileName: 'mark.svg', folder: 'branding' },
        { url: CDN },
      ),
    ]);

    pickDeviceFile(svg);
    expect(await screen.findByRole('heading', { name: 'Logo — review' })).toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Upload' }));

    await vi.waitFor(() => expect(onUploaded).toHaveBeenCalledWith(CDN));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('goes back to the sources from the review, and cancel closes without uploading', async () => {
    const { onClose, onUploaded } = renderDialog();

    pickDeviceFile(new File(['<svg/>'], 'mark.svg', { type: 'image/svg+xml' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Back' }));
    expect(screen.getByRole('heading', { name: 'Logo' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'From your device' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onUploaded).not.toHaveBeenCalled();
  });

  it('crops a picked stock photo to the framing chosen, showing progress while it uploads', async () => {
    const cropped = 'data:image/jpeg;base64,Q1JPUA==';
    let release: (value: string) => void = () => undefined;
    vi.spyOn(crop, 'cropImageToDataUrl').mockReturnValue(
      new Promise<string>((resolve) => {
        release = resolve;
      }),
    );
    const photo = pexelsItem();
    const { onUploaded } = renderDialog({}, [
      {
        request: {
          query: SearchPexelsPhotosDocument,
          variables: { query: 'sea', filters: { orientation: null, size: null, color: null } },
        },
        result: { data: { searchPexelsPhotos: [photo] } },
      },
      uploadMock({ file: cropped, fileName: 'pexels-101.jpg' }, { url: CDN }),
    ]);

    await userEvent.click(screen.getByRole('tab', { name: 'Pexels images' }));
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Search Pexels photos' }),
      'sea{Enter}',
    );
    await userEvent.click(await screen.findByRole('button', { name: /Use A lighthouse/ }));
    await userEvent.click(await screen.findByRole('button', { name: 'frame it' }));
    await userEvent.click(screen.getByRole('button', { name: 'Upload' }));

    expect(await screen.findByRole('button', { name: 'Uploading…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled();
    expect(crop.cropImageToDataUrl).toHaveBeenCalledWith(
      photo.url,
      { x: 1, y: 1, width: 5, height: 5 },
      'image/jpeg',
    );

    release(cropped);
    await vi.waitFor(() => expect(onUploaded).toHaveBeenCalledWith(CDN));
  });
});
