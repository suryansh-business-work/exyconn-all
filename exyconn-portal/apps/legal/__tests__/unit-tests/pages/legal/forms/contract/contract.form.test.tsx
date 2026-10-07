import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContractStatus, ContractType } from '@exyconn/shell/graphql/generated';
import { ContractForm, type ContractRow } from '../../../../../../src/pages/legal/forms/contract';
import { renderWithProviders } from '../../../../test-utils';
import { fill, localIso, pickDate, pickOption } from '../../../../form.helpers';
import { contractRow } from '../../legal.fixtures';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), body: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateContractMutation: () => [gql.create],
  useUpdateContractMutation: () => [gql.update],
  useGetContractBodyQuery: gql.body,
}));
vi.mock('@exyconn/shell/components/form/rhf/RhfRichText', async () => ({
  RhfRichText: (await import('../../../../rich-text.stub')).RhfRichTextStub,
}));
vi.mock('@exyconn/shell/components/form/RichTextDownload', async () => ({
  RichTextDownload: (await import('../../../../rich-text.stub')).RichTextDownloadStub,
}));

const onDone = vi.fn();
const onCancel = vi.fn();

/** What `useGetContractBodyQuery` answers once the text of contract-1 has arrived. */
const bodyArrived = (content: string | null) => ({
  data: { getContract: { __typename: 'Contract', id: 'contract-1', title: 'MSA', content } },
  loading: false,
  error: undefined,
});

const renderForm = (initial: ContractRow | null = null) =>
  renderWithProviders(<ContractForm initial={initial} onDone={onDone} onCancel={onCancel} />);

const click = (name: string) => userEvent.click(screen.getByRole('button', { name }));

describe('ContractForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: {} });
    gql.update.mockReset().mockResolvedValue({ data: {} });
    gql.body.mockReset().mockReturnValue({ data: undefined, loading: false, error: undefined });
    onDone.mockReset();
    onCancel.mockReset();
  });

  it('opens a new contract as an NDA draft, without fetching any text', () => {
    renderForm();
    expect(gql.body).toHaveBeenCalledWith({
      variables: { id: '' },
      skip: true,
      fetchPolicy: 'network-only',
    });
    expect(screen.getByRole('combobox', { name: /^Type/ })).toHaveTextContent('Nda');
    expect(screen.getByRole('combobox', { name: /^Status/ })).toHaveTextContent('Draft');
    expect(screen.getByLabelText('Contract text')).toHaveValue('');
    expect(screen.getByTestId('rich-text')).toHaveAttribute('data-folder', 'legal-contracts');
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });

  it('asks for the title, the counterparty and both dates before saving', async () => {
    renderForm();
    await click('Create');
    expect(await screen.findByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('Party is required')).toBeInTheDocument();
    expect(screen.getByText('Effective date is required')).toBeInTheDocument();
    expect(screen.getByText('Expiry date is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('creates the contract with what was entered, trimmed', async () => {
    renderForm();
    fill('Title', '  Master services  ');
    fill('Counterparty', 'Acme Inc');
    await pickOption(/^Type/, 'Msa');
    pickDate('effectiveDate', '01/15/2026');
    pickDate('expiryDate', '01/14/2027');
    fill('Contract text', '<p>Terms</p>');
    fill('Document URL', ' https://cdn.example.com/msa.pdf ');
    await click('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          title: 'Master services',
          party: 'Acme Inc',
          type: ContractType.Msa,
          effectiveDate: localIso(2026, 0, 15),
          expiryDate: localIso(2027, 0, 14),
          status: ContractStatus.Draft,
          documentUrl: 'https://cdn.example.com/msa.pdf',
          content: '<p>Terms</p>',
        },
      },
    });
    expect(await screen.findByText('Contract created')).toBeInTheDocument();
  });

  it('loads the text of the contract being edited, then saves it back onto that contract', async () => {
    gql.body.mockReturnValue(bodyArrived('<p>Body</p>'));
    const row = contractRow();
    renderForm(row);

    expect(gql.body).toHaveBeenCalledWith({
      variables: { id: 'contract-1' },
      skip: false,
      fetchPolicy: 'network-only',
    });
    expect(screen.getByLabelText('Title')).toHaveValue('Master services agreement');
    expect(screen.getByLabelText('Contract text')).toHaveValue('<p>Body</p>');
    expect(screen.getByTestId('download')).toHaveTextContent('<p>Body</p>');
    expect(screen.getByTestId('download')).toHaveAttribute('data-title', row.title);

    await click('Update');
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'contract-1',
        input: {
          title: row.title,
          party: row.party,
          type: row.type,
          effectiveDate: row.effectiveDate,
          expiryDate: row.expiryDate,
          status: row.status,
          documentUrl: row.documentUrl,
          content: '<p>Body</p>',
        },
      },
    });
    expect(await screen.findByText('Contract updated')).toBeInTheDocument();
  });

  it('downloads under the title as it is being typed', () => {
    gql.body.mockReturnValue(bodyArrived('<p>Body</p>'));
    renderForm(contractRow());
    fill('Title', 'Renamed agreement');
    fill('Contract text', '<p>New body</p>');
    expect(screen.getByTestId('download')).toHaveAttribute('data-title', 'Renamed agreement');
    expect(screen.getByTestId('download')).toHaveTextContent('<p>New body</p>');
  });

  it('starts the text empty when the contract has none yet', () => {
    gql.body.mockReturnValue(bodyArrived(null));
    renderForm(contractRow());
    expect(screen.getByLabelText('Contract text')).toHaveValue('');
  });

  it('holds the fields back while the text loads', () => {
    gql.body.mockReturnValue({ data: undefined, loading: true, error: undefined });
    renderForm(contractRow());
    expect(screen.getByRole('progressbar', { name: 'Loading the document' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();
  });

  it('says so, rather than offering an empty form, when the text cannot be loaded', () => {
    gql.body.mockReturnValue({ data: undefined, loading: false, error: new Error('Gone') });
    renderForm(contractRow());
    expect(
      screen.getByText('The document text could not be loaded. Close this and try again.'),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();
  });

  it('keeps the form open and says why when the save fails', async () => {
    gql.body.mockReturnValue(bodyArrived('<p>Body</p>'));
    gql.update.mockRejectedValue(new Error('Contract is locked'));
    renderForm(contractRow());
    await click('Update');

    expect(await screen.findByText('Contract is locked')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel without saving', async () => {
    renderForm();
    await click('Cancel');
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(gql.create).not.toHaveBeenCalled();
  });
});
