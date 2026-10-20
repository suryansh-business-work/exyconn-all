import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { ContractDocumentField } from '../../../../../../src/pages/legal/forms/contract/ContractDocumentField';
import { renderWithProviders } from '../../../../test-utils';

const gql = vi.hoisted(() => ({ upload: vi.fn() }));
/** What the stubbed editor was last handed, so a test can drive its callbacks. */
const editor = vi.hoisted(() => ({
  props: null as null | {
    url: string | null;
    fileName: string;
    folder: string;
    onClose: () => void;
    onSaved: (url: string) => void;
  },
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useUploadImageMutation: () => [gql.upload],
}));
// The editor renders pages through pdf.js; its own tests cover it. Here it is a stand-in
// that reports whether it is open and on which file.
vi.mock('../../../../../../src/pages/legal/pdf-editor', () => ({
  PdfEditorDialog: (props: NonNullable<typeof editor.props>) => {
    editor.props = props;
    return props.url ? <div data-testid="pdf-editor">{props.url}</div> : null;
  },
}));

const PDF_URL = 'https://cdn.example.com/legal-contracts/Master%20agreement.pdf?v=2';
const UPLOADED_URL = 'https://cdn.example.com/legal-contracts/nda.pdf';

/** The field inside a form, with the form's value echoed so a test can read it. */
function Harness({ value, signed }: Readonly<{ value: string; signed: boolean }>) {
  const methods = useForm({ defaultValues: { documentUrl: value } });
  return (
    <FormProvider {...methods}>
      <ContractDocumentField signed={signed} />
      <output data-testid="value">{methods.watch('documentUrl')}</output>
    </FormProvider>
  );
}

const renderField = (value = '', signed = false) =>
  renderWithProviders(<Harness value={value} signed={signed} />);

const pdf = (name = 'nda.pdf', type = 'application/pdf') => new File(['%PDF-1.7'], name, { type });
const fileInput = () => screen.getByLabelText('Upload the contract PDF');
const value = () => screen.getByTestId('value').textContent;

describe('ContractDocumentField', () => {
  beforeEach(() => {
    gql.upload.mockReset().mockResolvedValue({ data: { uploadImage: UPLOADED_URL } });
    editor.props = null;
  });

  it('offers an upload, and nothing to open or remove, while there is no PDF', () => {
    renderField();
    expect(screen.getByText('Upload PDF')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit PDF' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
    expect(
      screen.getByText(
        'Optional while drafting. The PDF a counterparty reads before signing, up to 5 MB; its bytes are hashed when they sign.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('pdf-editor')).not.toBeInTheDocument();
  });

  it('links the attached PDF by its decoded file name and offers to replace it', () => {
    renderField(PDF_URL);
    const link = screen.getByRole('link', { name: 'Master agreement.pdf' });
    expect(link).toHaveAttribute('href', PDF_URL);
    expect(link).toHaveAttribute('target', '_blank');
    expect(screen.getByText('Replace PDF')).toBeInTheDocument();
  });

  it('uploads a chosen PDF to the contracts folder and points the contract at it', async () => {
    renderField();
    await userEvent.upload(fileInput(), pdf());

    await waitFor(() => expect(value()).toBe(UPLOADED_URL));
    expect(gql.upload).toHaveBeenCalledWith({
      variables: {
        file: expect.stringMatching(/^data:application\/pdf;base64,/),
        fileName: 'nda.pdf',
        folder: 'legal-contracts',
      },
    });
    expect(screen.getByRole('link', { name: 'nda.pdf' })).toBeInTheDocument();
  });

  it('refuses a file that is not a PDF without uploading it', async () => {
    renderField();
    const user = userEvent.setup({ applyAccept: false });
    await user.upload(fileInput(), pdf('photo.png', 'image/png'));

    expect(await screen.findByText('Choose a PDF of 5 MB or less')).toBeInTheDocument();
    expect(gql.upload).not.toHaveBeenCalled();
    expect(value()).toBe('');
  });

  it('refuses a PDF over 5 MB without uploading it', async () => {
    renderField();
    const big = pdf();
    Object.defineProperty(big, 'size', { value: 5 * 1024 * 1024 + 1 });
    await userEvent.upload(fileInput(), big);

    expect(await screen.findByText('Choose a PDF of 5 MB or less')).toBeInTheDocument();
    expect(gql.upload).not.toHaveBeenCalled();
  });

  it('does nothing when the file picker is closed without a choice', async () => {
    renderField();
    fireEvent.change(fileInput(), { target: { files: [] } });

    expect(gql.upload).not.toHaveBeenCalled();
    expect(value()).toBe('');
  });

  it('says why an upload failed and keeps the old value', async () => {
    gql.upload.mockRejectedValue(new Error('The CDN is down'));
    renderField(PDF_URL);
    await userEvent.upload(fileInput(), pdf());

    expect(await screen.findByText('The CDN is down')).toBeInTheDocument();
    expect(value()).toBe(PDF_URL);
  });

  it('treats an upload that answers with no URL as a failure', async () => {
    gql.upload.mockResolvedValue({ data: { uploadImage: '' } });
    renderField();
    await userEvent.upload(fileInput(), pdf());

    expect(await screen.findByText('Upload returned no URL')).toBeInTheDocument();
    expect(value()).toBe('');
  });

  it('falls back to a plain message when the failure carries none', async () => {
    gql.upload.mockRejectedValue('offline');
    renderField();
    await userEvent.upload(fileInput(), pdf());

    expect(await screen.findByText('The PDF could not be uploaded')).toBeInTheDocument();
  });

  it('removes the PDF from the contract', async () => {
    renderField(PDF_URL);
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));

    expect(value()).toBe('');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Upload PDF')).toBeInTheDocument();
  });

  it('warns that editing a signed contract makes a file the signatures do not cover', () => {
    renderField(PDF_URL, true);
    expect(
      screen.getByText(
        'This contract is signed. Editing makes a new file that the existing signatures do not cover.',
      ),
    ).toBeInTheDocument();
  });

  it('gives no signed warning while a signed contract has no PDF, or an unsigned one has', () => {
    const { unmount } = renderField('', true);
    expect(screen.queryByText(/This contract is signed/)).not.toBeInTheDocument();
    unmount();
    renderField(PDF_URL, false);
    expect(screen.queryByText(/This contract is signed/)).not.toBeInTheDocument();
  });

  it('opens the editor on the attached PDF, and closes it again', async () => {
    renderField(PDF_URL);
    expect(editor.props?.url).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Edit PDF' }));

    expect(screen.getByTestId('pdf-editor')).toHaveTextContent(PDF_URL);
    expect(editor.props).toMatchObject({
      fileName: 'Master agreement.pdf',
      folder: 'legal-contracts',
    });
    act(() => editor.props?.onClose());
    expect(screen.queryByTestId('pdf-editor')).not.toBeInTheDocument();
    expect(value()).toBe(PDF_URL);
  });

  it('points the contract at the edited copy once the editor saves it', async () => {
    renderField(PDF_URL);
    await userEvent.click(screen.getByRole('button', { name: 'Edit PDF' }));

    act(() => editor.props?.onSaved('https://cdn.example.com/legal-contracts/edited.pdf'));

    expect(value()).toBe('https://cdn.example.com/legal-contracts/edited.pdf');
    expect(screen.queryByTestId('pdf-editor')).not.toBeInTheDocument();
  });
});
