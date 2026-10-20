import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StampDialog } from '../../../../../src/pages/legal/pdf-editor/StampDialog';
import { renderWithProviders } from '../../../test-utils';
import { LoadingImage, PAD_SIGNATURE } from './pdf-editor.stubs';

vi.mock('@exyconn/shell/components/signature', async () => ({
  SignaturePad: (await import('./pdf-editor.stubs')).SignaturePadStub,
}));

const onClose = vi.fn();
const onReady = vi.fn();

const renderDialog = (kind: 'image' | 'signature' | null) =>
  renderWithProviders(<StampDialog kind={kind} onClose={onClose} onReady={onReady} />);

const pictureInput = () =>
  document.querySelector<HTMLInputElement>('input[type="file"]') as HTMLInputElement;

/** Hands the hidden input a file, the way the browser's picker does. */
const choose = (files: File[]) => fireEvent.change(pictureInput(), { target: { files } });

describe('StampDialog', () => {
  beforeEach(() => {
    onClose.mockReset();
    onReady.mockReset();
    vi.stubGlobal('Image', LoadingImage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('stays closed until a tool asks for a picture', () => {
    renderDialog(null);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('asks for a PNG or JPEG for the Image tool and hands it over with its shape', async () => {
    renderDialog('image');
    expect(screen.getByRole('heading', { name: 'Add an image' })).toBeInTheDocument();
    expect(pictureInput()).toHaveAttribute('accept', 'image/png,image/jpeg');
    expect(screen.queryByRole('button', { name: 'Place on page' })).not.toBeInTheDocument();

    choose([new File(['png'], 'logo.png', { type: 'image/png' })]);

    await waitFor(() =>
      expect(onReady).toHaveBeenCalledWith({
        src: expect.stringMatching(/^data:image\/png;base64,/),
        aspect: 0.5,
      }),
    );
  });

  it('refuses another kind of file, or one over 5 MB', async () => {
    renderDialog('image');

    choose([new File(['gif'], 'anim.gif', { type: 'image/gif' })]);
    expect(await screen.findByText('Choose a PNG or JPEG image under 5 MB')).toBeInTheDocument();

    const big = new File(['jpg'], 'scan.jpg', { type: 'image/jpeg' });
    Object.defineProperty(big, 'size', { value: 5 * 1024 * 1024 + 1 });
    choose([big]);
    expect(onReady).not.toHaveBeenCalled();
  });

  it('does nothing when the picker closes without a file', () => {
    renderDialog('image');
    choose([]);
    expect(onReady).not.toHaveBeenCalled();
    expect(screen.queryByText('Choose a PNG or JPEG image under 5 MB')).not.toBeInTheDocument();
  });

  it('places a drawn signature once there is one, at a default shape if it cannot be read', async () => {
    vi.stubGlobal(
      'Image',
      class extends LoadingImage {
        naturalWidth = 0;
        naturalHeight = 0;
      },
    );
    renderDialog('signature');
    expect(screen.getByRole('heading', { name: 'Add your signature' })).toBeInTheDocument();
    expect(screen.getByText('Then click on the page where it should go.')).toBeInTheDocument();
    const place = screen.getByRole('button', { name: 'Place on page' });
    expect(place).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Draw a signature' }));
    await userEvent.click(place);

    await waitFor(() => expect(onReady).toHaveBeenCalledWith({ src: PAD_SIGNATURE, aspect: 0.3 }));
    await waitFor(() => expect(place).toBeDisabled());
  });

  it('falls back to a default shape when the picture fails to load', async () => {
    vi.stubGlobal(
      'Image',
      class extends LoadingImage {
        set src(_value: string) {
          queueMicrotask(() => this.onerror?.());
        }
      },
    );
    renderDialog('signature');
    await userEvent.click(screen.getByRole('button', { name: 'Draw a signature' }));
    await userEvent.click(screen.getByRole('button', { name: 'Place on page' }));

    await waitFor(() => expect(onReady).toHaveBeenCalledWith({ src: PAD_SIGNATURE, aspect: 0.3 }));
  });

  it('forgets a signature drawn and then cancelled', async () => {
    renderDialog('signature');
    await userEvent.click(screen.getByRole('button', { name: 'Draw a signature' }));
    expect(screen.getByRole('button', { name: 'Place on page' })).toBeEnabled();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Place on page' })).toBeDisabled();
  });

  it('says so when a chosen image cannot be read', async () => {
    vi.stubGlobal(
      'FileReader',
      class {
        error = new Error('unreadable');
        onerror: (() => void) | null = null;
        readAsDataURL() {
          queueMicrotask(() => this.onerror?.());
        }
      },
    );
    renderDialog('image');

    choose([new File(['png'], 'logo.png', { type: 'image/png' })]);

    expect(
      await screen.findByText('The image could not be read. Try another file.'),
    ).toBeInTheDocument();
    expect(onReady).not.toHaveBeenCalled();
  });

  it('closes on Cancel', async () => {
    renderDialog('image');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
