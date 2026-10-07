import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IMAGE_MESSAGES, ImageForm, altFromFileName } from '../../../../src/forms/image';
import type { UploadImage } from '../../../../src/types';

const HOSTED = 'https://ik.imagekit.io/x/team.png';

const renderForm = (uploadImage: UploadImage = vi.fn(async () => HOSTED)) => {
  const onSubmit = vi.fn();
  const onClose = vi.fn();
  render(<ImageForm uploadImage={uploadImage} onSubmit={onSubmit} onClose={onClose} />);
  const field = (name: string) => screen.getByRole('textbox', { name });
  return { onSubmit, onClose, field };
};

const insert = () => fireEvent.click(screen.getByRole('button', { name: 'Insert' }));
const upload = (file: File) =>
  fireEvent.change(screen.getByLabelText('Image file'), { target: { files: [file] } });

describe('ImageForm', () => {
  it('requires an image and its alt text', async () => {
    const { onSubmit } = renderForm();
    insert();
    expect(await screen.findByText(IMAGE_MESSAGES.srcRequired)).toBeInTheDocument();
    expect(screen.getByText(IMAGE_MESSAGES.altRequired)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects an address that is not http(s) and over-long alt text and title', async () => {
    const { field } = renderForm();
    fireEvent.change(field('Image URL'), { target: { value: 'ftp://x.test/a.png' } });
    fireEvent.change(field('Alt text'), { target: { value: 'a'.repeat(251) } });
    fireEvent.change(field('Title (optional)'), { target: { value: 't'.repeat(251) } });
    insert();
    expect(await screen.findByText(IMAGE_MESSAGES.srcInvalid)).toBeInTheDocument();
    expect(screen.getByText('Alt text must be 250 characters or fewer')).toBeInTheDocument();
    expect(screen.getByText('Title must be 250 characters or fewer')).toBeInTheDocument();
  });

  it('previews a hosted image and inserts the trimmed values', async () => {
    const { onSubmit, field } = renderForm();
    expect(document.querySelector('img')).toBeNull();
    fireEvent.change(field('Image URL'), { target: { value: `${HOSTED} ` } });
    expect(document.querySelector('img')).toHaveAttribute('src', `${HOSTED} `);
    fireEvent.change(field('Alt text'), { target: { value: ' Team ' } });
    insert();
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { src: HOSTED, alt: 'Team', title: '' },
        expect.anything(),
      ),
    );
  });

  it('fills the address and a starting alt text from an upload', async () => {
    const uploadImage = vi.fn(async () => HOSTED);
    const { field } = renderForm(uploadImage);
    const file = new File(['x'], 'team-offsite_2026.png', { type: 'image/png' });
    upload(file);
    await waitFor(() => expect(field('Image URL')).toHaveValue(HOSTED));
    expect(uploadImage).toHaveBeenCalledWith(file);
    expect(field('Alt text')).toHaveValue('team offsite 2026');
  });

  it('keeps alt text already written when an image is uploaded', async () => {
    const { field } = renderForm();
    fireEvent.change(field('Alt text'), { target: { value: 'Our team' } });
    upload(new File(['x'], 'photo.png', { type: 'image/png' }));
    await waitFor(() => expect(field('Image URL')).toHaveValue(HOSTED));
    expect(field('Alt text')).toHaveValue('Our team');
  });

  it('shows an upload failure on the address field', async () => {
    renderForm(vi.fn(async () => Promise.reject(new Error('File too large'))));
    upload(new File(['x'], 'big.png', { type: 'image/png' }));
    expect(await screen.findByText('File too large')).toBeInTheDocument();
  });

  it('closes on cancel', () => {
    const { onClose } = renderForm();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('altFromFileName', () => {
  it('keeps a name without an extension and collapses runs of separators', () => {
    expect(altFromFileName('hero--banner__wide')).toBe('hero banner wide');
    expect(altFromFileName('-logo-.png')).toBe('logo');
  });
});
