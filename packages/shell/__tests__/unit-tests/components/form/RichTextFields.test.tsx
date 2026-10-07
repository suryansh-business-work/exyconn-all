import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { RhfRichText } from '@/components/form/rhf';
import { RichTextDownload } from '@/components/form/RichTextDownload';
import { renderWithProviders } from '../../test-utils';
import { FormHarness, formValues } from './formHarness';

const mocks = vi.hoisted(() => ({
  save: vi.fn(),
  uploadImage: vi.fn(),
  useImageKitUpload: vi.fn(),
}));

interface EditorStubProps {
  value: string;
  onChange: (html: string) => void;
  onBlur: () => void;
  uploadImage: (file: File) => Promise<string>;
  label: string;
  helperText?: string;
  error?: string;
  placeholder?: string;
  minHeight?: number;
}

interface MenuStubProps {
  labels: { button: string; pdf: string; docx: string };
  disabled?: boolean;
  onSelect: (format: 'pdf' | 'docx') => Promise<void>;
}

// The editor and the export menu are @exyconn/rich-text's own (tested there); these stand-ins
// show exactly what the shell hands them.
vi.mock('@exyconn/rich-text', () => ({
  RichTextEditor: (props: Readonly<EditorStubProps>) => (
    <div
      data-testid="editor"
      data-min-height={props.minHeight}
      data-upload={String(props.uploadImage === mocks.uploadImage)}
    >
      <label>
        {props.label}
        <textarea
          value={props.value}
          placeholder={props.placeholder}
          onChange={(event) => props.onChange(event.target.value)}
          onBlur={props.onBlur}
        />
      </label>
      {props.helperText && <p>{props.helperText}</p>}
      {props.error && <p role="alert">{props.error}</p>}
    </div>
  ),
  DownloadMenu: ({ labels, disabled, onSelect }: Readonly<MenuStubProps>) => (
    <div>
      <button type="button" disabled={disabled}>
        {labels.button}
      </button>
      <button type="button" disabled={disabled} onClick={() => onSelect('pdf')}>
        {labels.pdf}
      </button>
      <button type="button" disabled={disabled} onClick={() => onSelect('docx')}>
        {labels.docx}
      </button>
    </div>
  ),
}));
vi.mock('@/hooks/useImageKitUpload', () => ({ useImageKitUpload: mocks.useImageKitUpload }));
vi.mock('@/hooks/useRichTextExport', () => ({ useRichTextExport: () => mocks.save }));

beforeEach(() => {
  mocks.save.mockReset();
  mocks.useImageKitUpload.mockReset().mockReturnValue(mocks.uploadImage);
});

describe('RhfRichText', () => {
  it('edits the form value, uploading images into the default folder', async () => {
    renderWithProviders(
      <FormHarness defaultValues={{ body: '<p>Hi</p>' }}>
        <RhfRichText
          name="body"
          label="Body"
          helperText="Markdown is not supported"
          placeholder="Write…"
          minHeight={240}
        />
      </FormHarness>,
      { messages: { Body: 'Cuerpo' } },
    );

    const editor = screen.getByLabelText('Cuerpo');
    expect(editor).toHaveValue('<p>Hi</p>');
    expect(editor).toHaveAttribute('placeholder', 'Write…');
    expect(screen.getByText('Markdown is not supported')).toBeInTheDocument();
    expect(screen.getByTestId('editor')).toHaveAttribute('data-min-height', '240');
    expect(screen.getByTestId('editor')).toHaveAttribute('data-upload', 'true');
    expect(mocks.useImageKitUpload).toHaveBeenCalledWith('rich-text');

    fireEvent.change(editor, { target: { value: '<p>Hello</p>' } });
    expect(formValues().body).toBe('<p>Hello</p>');
  });

  it('starts empty for a missing value, with no hint, in a chosen folder', () => {
    renderWithProviders(
      <FormHarness defaultValues={{}}>
        <RhfRichText name="body" label="Body" folder="blog" />
      </FormHarness>,
    );

    expect(screen.getByLabelText('Body')).toHaveValue('');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(mocks.useImageKitUpload).toHaveBeenCalledWith('blog');
  });

  it('shows the validation message, translated', async () => {
    const schema = z.object({ body: z.string().min(1, 'Write something') });
    renderWithProviders(
      <FormHarness defaultValues={{ body: '' }} resolver={zodResolver(schema)}>
        <RhfRichText name="body" label="Body" />
      </FormHarness>,
      { messages: { 'Write something': 'Escribe algo' } },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Escribe algo');
  });
});

describe('RichTextDownload', () => {
  it('saves the document as the chosen format under its title', async () => {
    renderWithProviders(<RichTextDownload title="Offer letter" html="<p>Dear Asha</p>" />, {
      messages: { 'Word document': 'Documento de Word' },
    });

    await userEvent.click(screen.getByRole('button', { name: 'PDF' }));
    await userEvent.click(screen.getByRole('button', { name: 'Documento de Word' }));

    expect(mocks.save).toHaveBeenNthCalledWith(1, '<p>Dear Asha</p>', 'Offer letter', 'pdf');
    expect(mocks.save).toHaveBeenNthCalledWith(2, '<p>Dear Asha</p>', 'Offer letter', 'docx');
  });

  it('is disabled while the document is blank', () => {
    renderWithProviders(<RichTextDownload title="Draft" html="   " />);

    expect(screen.getByRole('button', { name: 'Download' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'PDF' })).toBeDisabled();
  });
});
