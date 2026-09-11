import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RichTextEditor } from '../../src';
import { altFromFileName } from '../../src/forms/image';

const renderEditor = (props: Partial<Parameters<typeof RichTextEditor>[0]> = {}) => {
  const onChange = vi.fn();
  const uploadImage = vi.fn(async () => 'https://ik.imagekit.io/x/a.png');
  render(
    <RichTextEditor
      label="Body"
      value="<p>Hello</p>"
      onChange={onChange}
      uploadImage={uploadImage}
      {...props}
    />,
  );
  return { onChange, uploadImage };
};

describe('RichTextEditor', () => {
  it('renders the label, the document and the formatting toolbar', () => {
    renderEditor({ helperText: 'Shown on the site' });
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Body' })).toHaveTextContent('Hello');
    expect(screen.getByRole('toolbar', { name: 'Formatting' })).toBeInTheDocument();
    for (const label of ['Bold', 'Table', 'Image', 'Link', 'Checklist', 'HTML source']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
    expect(screen.getByText('Shown on the site')).toBeInTheDocument();
  });

  it('shows the validation message instead of the helper text', () => {
    renderEditor({ helperText: 'Shown on the site', error: 'Content is required' });
    expect(screen.getByText('Content is required')).toBeInTheDocument();
    expect(screen.queryByText('Shown on the site')).not.toBeInTheDocument();
  });

  it('counts words and characters', () => {
    renderEditor({ value: '<p>Two words</p>' });
    expect(screen.getByText('2 words · 9 characters')).toBeInTheDocument();
  });

  it('edits the HTML source and reports the normalised document', async () => {
    const { onChange } = renderEditor();
    fireEvent.click(screen.getByRole('button', { name: 'HTML source' }));
    const source = screen.getByRole('textbox', { name: 'Body (HTML source)' });
    expect(source).toHaveValue('<p>Hello</p>');
    expect(screen.getByRole('button', { name: 'Bold' })).toBeDisabled();

    fireEvent.change(source, { target: { value: '<h2>Title</h2><script>x</script>' } });
    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith('<h2>Title</h2><p></p>'));
  });

  it('re-syncs when the value changes from outside', () => {
    const { rerender } = render(
      <RichTextEditor label="Body" value="<p>One</p>" onChange={vi.fn()} uploadImage={vi.fn()} />,
    );
    rerender(
      <RichTextEditor label="Body" value="<p>Two</p>" onChange={vi.fn()} uploadImage={vi.fn()} />,
    );
    expect(screen.getByRole('textbox', { name: 'Body' })).toHaveTextContent('Two');
  });

  it('opens the link and image dialogs', () => {
    renderEditor();
    fireEvent.click(screen.getByRole('button', { name: 'Link' }));
    expect(screen.getByRole('dialog', { name: 'Add link' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    fireEvent.click(screen.getByRole('button', { name: 'Image' }));
    expect(screen.getByRole('dialog', { name: 'Insert image' })).toBeInTheDocument();
  });
});

describe('altFromFileName', () => {
  it('turns a file name into readable alt text', () => {
    expect(altFromFileName('team-offsite_2026.jpg')).toBe('team offsite 2026');
    expect(altFromFileName('logo.svg')).toBe('logo');
  });
});
