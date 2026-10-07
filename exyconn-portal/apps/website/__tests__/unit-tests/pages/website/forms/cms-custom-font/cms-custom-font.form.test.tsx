import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CustomFontForm } from '../../../../../../src/pages/website/forms/cms-custom-font';
import { renderWithProviders } from '../../../../test-utils';
import { fillField, press } from '../content-form-helpers';
import { fontFile } from './font-files';

const media = vi.hoisted(() => ({ upload: vi.fn(), siteIds: [] as string[] }));

/** The real font helpers, with the upload itself replaced. */
vi.mock('../../../../../../src/pages/cms/media', async () => {
  const real = await import('../../../../../../src/pages/cms/media/useFontUpload');
  return {
    FONT_ACCEPT: real.FONT_ACCEPT,
    MAX_FONT_BYTES: real.MAX_FONT_BYTES,
    fontFormatOf: real.fontFormatOf,
    useFontUpload: (siteId: string) => {
      media.siteIds.push(siteId);
      return media.upload;
    },
  };
});

function renderForm(open = true) {
  const onClose = vi.fn();
  const onAdd = vi.fn();
  const outerSubmit = vi.fn();
  const view = renderWithProviders(
    <form onSubmit={outerSubmit}>
      <CustomFontForm open={open} siteId="site-1" onClose={onClose} onAdd={onAdd} />
    </form>,
  );
  return { ...view, onClose, onAdd, outerSubmit };
}

const fileInput = () => {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error('No file input');
  return input;
};

const pick = (...files: File[]) => fireEvent.change(fileInput(), { target: { files } });

describe('CustomFontForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    media.siteIds.length = 0;
    media.upload.mockImplementation((file: File) => Promise.resolve(`/media/${file.name}`));
  });

  it('stays closed until opened', () => {
    renderForm(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the hidden picker for font files only', async () => {
    renderForm();
    const input = fileInput();
    const click = vi.spyOn(input, 'click');

    await press('Choose font files');

    expect(click).toHaveBeenCalledTimes(1);
    expect(input).toHaveAttribute('accept', '.woff2,.woff,.ttf,.otf');
    expect(input).toHaveAttribute('multiple');
    expect(media.siteIds).toContain('site-1');
  });

  it('lists each picked font with a guessed weight and style', () => {
    renderForm();
    pick(fontFile('Brand-SemiBoldItalic.woff2'), fontFile('Brand-Regular.ttf'));
    expect(screen.getByText('Brand-SemiBoldItalic.woff2 · 10 B')).toBeInTheDocument();
    expect(screen.getByText('woff2')).toBeInTheDocument();
    expect(screen.getByText('truetype')).toBeInTheDocument();
    const [firstWeight, secondWeight] = screen.getAllByRole('combobox', { name: /^Weight/ });
    expect(firstWeight).toHaveTextContent('600');
    expect(secondWeight).toHaveTextContent('400');
    expect(screen.getAllByRole('combobox', { name: /^Style/ })[0]).toHaveTextContent('Italic');
    expect(fileInput().value).toBe('');
  });

  it('turns away a file that is not a font, and a picker closed without a choice', async () => {
    renderForm();
    fireEvent.change(fileInput(), { target: { files: null } });
    pick(fontFile('notes.txt'));
    expect(
      await screen.findByText('notes.txt is not a WOFF2, WOFF, TTF or OTF font'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: /^Weight/ })).not.toBeInTheDocument();
  });

  it('needs a family name and at least one file', async () => {
    const { onAdd } = renderForm();
    await press('Upload and add');
    expect(await screen.findByText('Name the family')).toBeInTheDocument();
    expect(screen.getByText('Add at least one font file')).toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('flags a file over 5 MB', async () => {
    renderForm();
    await fillField('Family name', 'Brand Sans');
    pick(fontFile('Brand-Bold.woff2', 6 * 1024 * 1024));

    await press('Upload and add');

    expect(await screen.findByText('Check the files')).toBeInTheDocument();
    expect(media.upload).not.toHaveBeenCalled();
  });

  it('uploads every file and adds the family to the design system', async () => {
    const { onAdd, onClose, outerSubmit } = renderForm();
    await fillField('Family name', 'Brand Sans');
    pick(fontFile('Brand-Regular.woff2'), fontFile('Brand-Bold.otf'));
    await userEvent.click(screen.getAllByRole('combobox', { name: /^Weight/ })[0]);
    await userEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: '300' }));
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    await press('Upload and add');

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(media.upload).toHaveBeenCalledTimes(2);
    expect(onAdd).toHaveBeenCalledWith({
      provider: 'CUSTOM',
      family: 'Brand Sans',
      files: [
        { url: '/media/Brand-Regular.woff2', weight: '300', style: 'normal', format: 'woff2' },
        { url: '/media/Brand-Bold.otf', weight: '700', style: 'normal', format: 'opentype' },
      ],
    });
    expect(
      await screen.findByText('Brand Sans uploaded — save the design system to use it'),
    ).toBeInTheDocument();
    expect(outerSubmit).not.toHaveBeenCalled();
  });

  it('shows the upload in progress and reports a failed one', async () => {
    let fail: (error: Error) => void = () => undefined;
    media.upload.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          fail = reject;
        }),
    );
    const { onAdd } = renderForm();
    await fillField('Family name', 'Brand Sans');
    pick(fontFile('Brand-Regular.woff2'));

    await press('Upload and add');
    await waitFor(() => expect(media.upload).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: 'Upload and add' })).toBeDisabled();
    fail(new Error('Brand-Regular.woff2 is larger than 5 MB'));

    expect(await screen.findByText('Brand-Regular.woff2 is larger than 5 MB')).toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Upload and add' })).toBeEnabled(),
    );
  });

  it('falls back to a generic message for a failure that is not an Error', async () => {
    media.upload.mockRejectedValue('offline');
    renderForm();
    await fillField('Family name', 'Brand Sans');
    pick(fontFile('Brand-Regular.woff2'));
    await press('Upload and add');
    expect(await screen.findByText('Could not upload the font')).toBeInTheDocument();
  });

  it('removes a picked file', async () => {
    renderForm();
    pick(fontFile('Brand-Regular.woff2'), fontFile('Brand-Bold.woff2'));
    await press('Remove Brand-Regular.woff2');
    expect(screen.queryByText(/Brand-Regular\.woff2 ·/)).not.toBeInTheDocument();
    expect(screen.getByText('Brand-Bold.woff2 · 10 B')).toBeInTheDocument();
  });

  it('starts empty each time it is opened', async () => {
    const { rerender } = renderForm();
    await fillField('Family name', 'Brand Sans');
    const reopen = (open: boolean) => (
      <form>
        <CustomFontForm open={open} siteId="site-1" onClose={vi.fn()} onAdd={vi.fn()} />
      </form>
    );

    rerender(reopen(false));
    rerender(reopen(true));

    expect(await screen.findByLabelText('Family name')).toHaveValue('');
  });

  it('closes from its cancel button', async () => {
    const { onClose } = renderForm();
    await press('Cancel');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
