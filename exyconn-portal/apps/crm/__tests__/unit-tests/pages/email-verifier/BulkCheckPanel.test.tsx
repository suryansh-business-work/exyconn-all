import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { EmailVerificationBatchStatus } from '@exyconn/shell/graphql/generated';
import { BulkCheckPanel } from '../../../../src/pages/email-verifier/BulkCheckPanel';
import { renderWithProviders } from '../../test-utils';
import { batch, type Batch } from './email-verifier-fixtures';

const gql = vi.hoisted(() => ({
  batches: undefined as Batch[] | undefined,
  startPolling: vi.fn(),
  stopPolling: vi.fn(),
  refetch: vi.fn(),
  createBatch: vi.fn(),
  loading: false,
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useEmailVerificationBatchesQuery: () => ({
    data: gql.batches && { emailVerificationBatches: gql.batches },
    startPolling: gql.startPolling,
    stopPolling: gql.stopPolling,
    refetch: gql.refetch,
  }),
  useCreateEmailVerificationBatchMutation: () => [gql.createBatch, { loading: gql.loading }],
}));

function fileInput(): HTMLInputElement {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error('No file input');
  return input;
}

function upload(files: File[]) {
  fireEvent.change(fileInput(), { target: { files } });
}

const csv = (text: string, name = 'leads.csv') => new File([text], name, { type: 'text/csv' });

describe('BulkCheckPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.batches = [];
    gql.loading = false;
    gql.refetch.mockResolvedValue({});
    gql.createBatch.mockResolvedValue({ data: { createEmailVerificationBatch: batch() } });
  });

  it('lists nothing before the first answer', () => {
    gql.batches = undefined;
    renderWithProviders(<BulkCheckPanel />);

    expect(screen.getByText('No bulk checks yet.')).toBeInTheDocument();
    expect(gql.startPolling).not.toHaveBeenCalled();
  });

  it('polls while a check is queued or running, and stops when it unmounts', () => {
    gql.batches = [batch({ status: EmailVerificationBatchStatus.Queued })];
    const { unmount } = renderWithProviders(<BulkCheckPanel />);

    expect(gql.startPolling).toHaveBeenCalledWith(5000);
    unmount();
    expect(gql.stopPolling).toHaveBeenCalled();
  });

  it('does not poll when every check has finished', () => {
    gql.batches = [batch({ status: EmailVerificationBatchStatus.Done })];
    renderWithProviders(<BulkCheckPanel />);

    expect(screen.getByRole('heading', { name: 'leads.csv' })).toBeInTheDocument();
    expect(gql.startPolling).not.toHaveBeenCalled();
  });

  it('queues every address in the file, confirms it and reloads the list', async () => {
    renderWithProviders(<BulkCheckPanel />);

    upload([csv('name,email\nAsha,asha@acme.com\nRavi,ravi@globex.io')]);

    await waitFor(() =>
      expect(gql.createBatch).toHaveBeenCalledWith({
        variables: { name: 'leads.csv', emails: ['asha@acme.com', 'ravi@globex.io'] },
      }),
    );
    expect(await screen.findByText('2 addresses queued for checking')).toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalled();
    expect(fileInput().value).toBe('');
  });

  it('does nothing when the picker is closed without a file', () => {
    renderWithProviders(<BulkCheckPanel />);

    upload([]);

    expect(gql.createBatch).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('says so when the file has no addresses in it', async () => {
    renderWithProviders(<BulkCheckPanel />);

    upload([csv('name,phone\nAsha,98765', 'contacts.csv')]);

    expect(
      await screen.findByText('No email addresses were found in contacts.csv.'),
    ).toBeInTheDocument();
    expect(gql.createBatch).not.toHaveBeenCalled();
  });

  it("shows the server's reason when the upload fails", async () => {
    gql.createBatch.mockRejectedValue(new Error('Over the 5,000 limit'));
    renderWithProviders(<BulkCheckPanel />);

    upload([csv('asha@acme.com')]);

    expect(await screen.findByText('Over the 5,000 limit')).toBeInTheDocument();
    expect(gql.refetch).not.toHaveBeenCalled();
  });

  it('falls back to a plain message when the failure carries none', async () => {
    gql.createBatch.mockRejectedValue('offline');
    renderWithProviders(<BulkCheckPanel />);

    upload([csv('asha@acme.com')]);

    expect(await screen.findByText('Could not start the bulk check')).toBeInTheDocument();
  });

  it('locks the upload button while a file is being sent', () => {
    gql.loading = true;
    renderWithProviders(<BulkCheckPanel />);

    expect(screen.getByText('Uploading…')).toBeInTheDocument();
    expect(screen.queryByText('Upload CSV')).not.toBeInTheDocument();
  });
});
