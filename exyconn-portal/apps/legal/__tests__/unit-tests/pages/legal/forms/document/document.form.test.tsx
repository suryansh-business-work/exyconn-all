import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocumentCategory, DocumentStatus } from '@exyconn/shell/graphql/generated';
import {
  DocumentForm,
  type LegalDocumentRow,
} from '../../../../../../src/pages/legal/forms/document';
import { renderWithProviders } from '../../../../test-utils';
import { fill, pickOption } from '../../../../form.helpers';
import { documentRow } from '../../legal.fixtures';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), body: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateLegalDocumentMutation: () => [gql.create],
  useUpdateLegalDocumentMutation: () => [gql.update],
  useGetLegalDocumentBodyQuery: gql.body,
}));
vi.mock('@exyconn/shell/components/form/rhf/RhfRichText', async () => ({
  RhfRichText: (await import('../../../../rich-text.stub')).RhfRichTextStub,
}));
vi.mock('@exyconn/shell/components/form/RichTextDownload', async () => ({
  RichTextDownload: (await import('../../../../rich-text.stub')).RichTextDownloadStub,
}));

const onDone = vi.fn();
const onCancel = vi.fn();

/** What `useGetLegalDocumentBodyQuery` answers once the text of document-1 has arrived. */
const bodyArrived = (content: string | null) => ({
  data: {
    getLegalDocument: { __typename: 'LegalDocument', id: 'document-1', title: 'DPA', content },
  },
  loading: false,
  error: undefined,
});

const renderForm = (initial: LegalDocumentRow | null = null) =>
  renderWithProviders(<DocumentForm initial={initial} onDone={onDone} onCancel={onCancel} />);

const click = (name: string) => userEvent.click(screen.getByRole('button', { name }));

describe('DocumentForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: {} });
    gql.update.mockReset().mockResolvedValue({ data: {} });
    gql.body.mockReset().mockReturnValue({ data: undefined, loading: false, error: undefined });
    onDone.mockReset();
    onCancel.mockReset();
  });

  it('opens a new document as an uncategorised draft, without fetching any text', () => {
    renderForm();
    expect(gql.body).toHaveBeenCalledWith({
      variables: { id: '' },
      skip: true,
      fetchPolicy: 'network-only',
    });
    expect(screen.getByRole('combobox', { name: /^Category/ })).toHaveTextContent('Other');
    expect(screen.getByRole('combobox', { name: /^Status/ })).toHaveTextContent('Draft');
    expect(screen.getByLabelText('Document')).toHaveValue('');
    expect(screen.getByTestId('rich-text')).toHaveAttribute('data-folder', 'legal-documents');
  });

  it('asks for a title before saving', async () => {
    renderForm();
    await click('Create');
    expect(await screen.findByText('Title is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('refuses a file link that is not a web address, and an owner over 120 characters', async () => {
    renderForm();
    fill('Document title', 'DPA');
    fill('File link (optional)', 'shared drive');
    fill('Owner (optional)', 'a'.repeat(121));
    await click('Create');
    expect(await screen.findByText('Enter a valid URL')).toBeInTheDocument();
    expect(screen.getByText('Keep the owner under 120 characters')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('saves a blank owner and file link as nothing rather than as empty text', async () => {
    renderForm();
    fill('Document title', '  Data processing addendum ');
    await click('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          title: 'Data processing addendum',
          category: DocumentCategory.Other,
          owner: null,
          fileUrl: null,
          status: DocumentStatus.Draft,
          content: '',
        },
      },
    });
    expect(await screen.findByText('Document created')).toBeInTheDocument();
  });

  it('keeps the owner, link, category and text that were entered', async () => {
    renderForm();
    fill('Document title', 'DPA');
    await pickOption(/^Category/, 'Compliance');
    fill('Owner (optional)', 'Legal team');
    fill('File link (optional)', 'https://cdn.example.com/dpa.pdf');
    fill('Document', '<p>Clauses</p>');
    await click('Create');

    await waitFor(() => expect(gql.create).toHaveBeenCalledTimes(1));
    expect(gql.create.mock.calls[0][0].variables.input).toEqual({
      title: 'DPA',
      category: DocumentCategory.Compliance,
      owner: 'Legal team',
      fileUrl: 'https://cdn.example.com/dpa.pdf',
      status: DocumentStatus.Draft,
      content: '<p>Clauses</p>',
    });
  });

  it('loads the text of the document being edited, then saves it back onto that document', async () => {
    gql.body.mockReturnValue(bodyArrived('<p>Clauses</p>'));
    renderForm(documentRow({ owner: null, fileUrl: null }));

    expect(gql.body).toHaveBeenCalledWith({
      variables: { id: 'document-1' },
      skip: false,
      fetchPolicy: 'network-only',
    });
    expect(screen.getByLabelText('Document title')).toHaveValue('Data processing addendum');
    expect(screen.getByLabelText('Owner (optional)')).toHaveValue('');
    expect(screen.getByLabelText('File link (optional)')).toHaveValue('');
    expect(screen.getByTestId('download')).toHaveTextContent('<p>Clauses</p>');
    expect(screen.getByTestId('download')).toHaveAttribute(
      'data-title',
      'Data processing addendum',
    );

    await click('Update');
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'document-1',
        input: {
          title: 'Data processing addendum',
          category: DocumentCategory.Compliance,
          owner: null,
          fileUrl: null,
          status: DocumentStatus.Final,
          content: '<p>Clauses</p>',
        },
      },
    });
    expect(await screen.findByText('Document updated')).toBeInTheDocument();
  });

  it('starts the text empty when the document has none yet', () => {
    gql.body.mockReturnValue(bodyArrived(null));
    renderForm(documentRow());
    expect(screen.getByLabelText('Document')).toHaveValue('');
    expect(screen.getByLabelText('Owner (optional)')).toHaveValue('Legal team');
  });

  it('holds the fields back while the text loads', () => {
    gql.body.mockReturnValue({ data: undefined, loading: true, error: undefined });
    renderForm(documentRow());
    expect(screen.getByRole('progressbar', { name: 'Loading the document' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Document title')).not.toBeInTheDocument();
  });

  it('keeps the form open and says why when the save fails', async () => {
    gql.body.mockReturnValue(bodyArrived('<p>Clauses</p>'));
    gql.update.mockRejectedValue(new Error('Document is archived'));
    renderForm(documentRow());
    await click('Update');

    expect(await screen.findByText('Document is archived')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel without saving', async () => {
    renderForm();
    await click('Cancel');
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(gql.create).not.toHaveBeenCalled();
  });
});
