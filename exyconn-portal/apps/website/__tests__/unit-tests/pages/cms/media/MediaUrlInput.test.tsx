import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MediaUrlInput } from '../../../../../src/pages/cms/media';
import { renderWithProviders } from '../../../test-utils';

vi.mock('../../../../../src/pages/cms/media/MediaLibrary', () => ({
  MediaLibrary: (props: Readonly<{ onPick?: (url: string) => void }>) => (
    <button type="button" onClick={() => props.onPick?.('https://cdn/picked.png')}>
      Pick file
    </button>
  ),
}));

interface UploadDialogStubProps {
  open: boolean;
  title?: string;
  folder?: string;
  onClose: () => void;
  onUploaded: (url: string) => void;
  uploadDataUrl?: (dataUrl: string, fileName: string) => Promise<string>;
}

/** The platform upload dialog, reduced to where it stores and its two ways out. */
vi.mock('@exyconn/shell/components/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/components/ui')>()),
  ImageUploadDialog: (props: Readonly<UploadDialogStubProps>) =>
    props.open ? (
      <dialog open aria-label={`Upload ${props.title}`}>
        <p>{props.uploadDataUrl ? 'Into the site library' : `Into ImageKit/${props.folder}`}</p>
        <button type="button" onClick={() => props.onUploaded('https://ik.imagekit.io/up.png')}>
          Finish upload
        </button>
        <button type="button" onClick={props.onClose}>
          Cancel upload
        </button>
      </dialog>
    ) : null,
}));

type Props = ComponentProps<typeof MediaUrlInput>;

function renderInput(overrides: Partial<Props> = {}) {
  const props: Props = { label: 'Cover image', value: '', onChange: vi.fn(), ...overrides };
  const view = renderWithProviders(<MediaUrlInput {...props} />, {
    messages: { 'Cover image': 'Titelbild' },
  });
  return { props, thumbnail: () => view.container.querySelector('img') };
}

describe('MediaUrlInput', () => {
  it('takes a typed URL under its translated label', async () => {
    const { props } = renderInput();
    const field = screen.getByRole('textbox', { name: 'Titelbild' });

    expect(field).toHaveAttribute('placeholder', 'https://…');
    await userEvent.type(field, 'h');
    await userEvent.tab();

    expect(props.onChange).toHaveBeenCalledWith('h');
  });

  it('reports a blur', async () => {
    const onBlur = vi.fn();
    renderInput({ onBlur });
    await userEvent.click(screen.getByRole('textbox'));
    await userEvent.tab();
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('shows a thumbnail for an image address or an ImageKit file', () => {
    const image = renderInput({ value: 'https://cdn/hero.webp?tr=w-200' });
    expect(image.thumbnail()).toHaveAttribute('src', 'https://cdn/hero.webp?tr=w-200');
  });

  it('shows a thumbnail for an ImageKit address without an extension', () => {
    const kit = renderInput({ value: 'https://ik.imagekit.io/exyconn/abc' });
    expect(kit.thumbnail()).not.toBeNull();
  });

  it('shows no thumbnail for a document', () => {
    const doc = renderInput({ value: 'https://cdn/brochure.pdf' });
    expect(doc.thumbnail()).toBeNull();
  });

  it('shows the error over the hint, or the translated hint', () => {
    const { unmount } = renderWithProviders(
      <MediaUrlInput
        label="Logo"
        value=""
        onChange={vi.fn()}
        error="Enter a URL"
        helperText="Square works best"
      />,
    );
    expect(screen.getByText('Enter a URL')).toBeInTheDocument();
    expect(screen.queryByText('Square works best')).not.toBeInTheDocument();
    unmount();

    renderInput({ helperText: 'Square works best' });
    expect(screen.getByText('Square works best')).toBeInTheDocument();
  });

  it('offers no library without a site', () => {
    renderInput();
    expect(screen.queryByRole('button', { name: 'Choose' })).not.toBeInTheDocument();
  });

  it("picks a file from the site's library into the field", async () => {
    const { props } = renderInput({ siteId: 'site-1' });

    await userEvent.click(screen.getByRole('button', { name: 'Choose' }));
    expect(screen.getByRole('dialog', { name: 'Titelbild' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Pick file' }));

    expect(props.onChange).toHaveBeenCalledWith('https://cdn/picked.png');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('uploads to ImageKit when there is no site, and closes on cancel', async () => {
    const { props } = renderInput();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Upload' }));
    const dialog = screen.getByRole('dialog', { name: 'Upload Titelbild' });
    expect(dialog).toHaveTextContent('Into ImageKit/website');

    await userEvent.click(screen.getByRole('button', { name: 'Finish upload' }));
    expect(props.onChange).toHaveBeenCalledWith('https://ik.imagekit.io/up.png');

    await userEvent.click(screen.getByRole('button', { name: 'Cancel upload' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it("uploads into the site's library when there is a site, and closes on cancel", async () => {
    const { props } = renderInput({ siteId: 'site-1' });

    await userEvent.click(screen.getByRole('button', { name: 'Upload' }));
    expect(screen.getByRole('dialog', { name: 'Upload Titelbild' })).toHaveTextContent(
      'Into the site library',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Finish upload' }));
    expect(props.onChange).toHaveBeenCalledWith('https://ik.imagekit.io/up.png');

    await userEvent.click(screen.getByRole('button', { name: 'Cancel upload' }));
    expect(screen.queryByRole('dialog', { name: 'Upload Titelbild' })).not.toBeInTheDocument();
  });
});
