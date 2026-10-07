import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { RhfImageField } from '@/components/form/rhf';
import { renderWithProviders } from '../../../test-utils';
import { FormHarness, formValues } from '../formHarness';

interface DialogStubProps {
  open: boolean;
  title?: string;
  folder?: string;
  currentUrl?: string | null;
  media?: string;
  onClose: () => void;
  onUploaded: (url: string) => void;
}

const UPLOADED = 'https://ik.imagekit.io/exyconn/branding/new.png';

// The dialog is tested on its own; this stand-in shows what the field passes it and lets the
// test finish an upload the way the dialog would.
vi.mock('@/components/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/components/ui')>()),
  ImageUploadDialog: (props: Readonly<DialogStubProps>) =>
    props.open ? (
      <div
        role="dialog"
        aria-label={props.title}
        data-folder={props.folder ?? ''}
        data-current={String(props.currentUrl)}
        data-media={props.media}
      >
        <button type="button" onClick={() => props.onUploaded(UPLOADED)}>
          finish upload
        </button>
        <button type="button" onClick={props.onClose}>
          close dialog
        </button>
      </div>
    ) : null,
}));

describe('RhfImageField', () => {
  it('shows an empty frame and the hint for a field with no image', () => {
    renderWithProviders(
      <FormHarness defaultValues={{}}>
        <RhfImageField name="logo" label="Logo" helperText="Square works best" />
      </FormHarness>,
    );

    expect(screen.getByText('Logo')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Selected preview' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
    expect(screen.getByText('Square works best')).toBeInTheDocument();
  });

  it('opens the upload dialog and writes the uploaded URL back', async () => {
    renderWithProviders(
      <FormHarness defaultValues={{ logo: '' }}>
        <RhfImageField name="logo" label="Logo" folder="branding" media="all" />
      </FormHarness>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Change' }));
    const dialog = screen.getByRole('dialog', { name: 'Logo' });
    expect(dialog).toHaveAttribute('data-folder', 'branding');
    expect(dialog).toHaveAttribute('data-current', 'null');
    expect(dialog).toHaveAttribute('data-media', 'all');

    await userEvent.click(screen.getByRole('button', { name: 'finish upload' }));
    expect(formValues().logo).toBe(UPLOADED);
    expect(screen.getByRole('img', { name: 'Selected preview' })).toHaveAttribute('src', UPLOADED);

    await userEvent.click(screen.getByRole('button', { name: 'close dialog' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('previews the current image, captions its URL, and removes it', async () => {
    const current = 'https://cdn.example.com/logo.png';
    renderWithProviders(
      <FormHarness defaultValues={{ logo: current }}>
        <RhfImageField name="logo" label="Logo" />
      </FormHarness>,
    );

    expect(screen.getByRole('img', { name: 'Selected preview' })).toHaveAttribute('src', current);
    expect(screen.getByText(current)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Change' }));
    expect(screen.getByRole('dialog')).toHaveAttribute('data-current', current);
    expect(screen.getByRole('dialog')).toHaveAttribute('data-media', 'image');

    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(formValues().logo).toBe('');
  });

  it('lets a hosted URL be pasted in with editableUrl', async () => {
    renderWithProviders(
      <FormHarness defaultValues={{ logo: '' }}>
        <RhfImageField name="logo" label="Hero image" editableUrl helperText="Or paste a link" />
      </FormHarness>,
    );

    const box = screen.getByRole('textbox', { name: 'Hero image' });
    expect(screen.getByText('Or paste a link')).toBeInTheDocument();
    await userEvent.type(box, 'https://cdn.example.com/hero.jpg');

    expect(formValues().logo).toBe('https://cdn.example.com/hero.jpg');
  });

  it('shows the validation message in the caption and in the editable box', async () => {
    const schema = z.object({ logo: z.string().min(1, 'Add a logo') });
    const { unmount } = renderWithProviders(
      <FormHarness defaultValues={{ logo: '' }} resolver={zodResolver(schema)}>
        <RhfImageField name="logo" label="Logo" helperText="Square works best" />
      </FormHarness>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByText('Add a logo')).toBeInTheDocument();
    expect(screen.queryByText('Square works best')).not.toBeInTheDocument();
    unmount();

    renderWithProviders(
      <FormHarness defaultValues={{ logo: '' }} resolver={zodResolver(schema)}>
        <RhfImageField name="logo" label="Logo" editableUrl helperText="Or paste a link" />
      </FormHarness>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByText('Add a logo')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Logo' })).toHaveAttribute('aria-invalid', 'true');
  });
});
