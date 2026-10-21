import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClientSharedKind } from '@exyconn/shell/graphql/generated';
import { DocumentsPage } from '../../../../src/pages/documents/DocumentsPage';
import { renderWithProviders } from '../../test-utils';
import { hubItem } from '../hub-records.fixtures';

const gql = vi.hoisted(() => ({
  useClientHubSharedItemsQuery: vi.fn(),
  useClientHubSharedContentQuery: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ...gql,
}));

const POLICY = hubItem({
  id: 'share-2',
  kind: ClientSharedKind.Policy,
  title: 'Privacy policy',
  status: 'PUBLISHED',
  fileUrl: '',
  hasContent: false,
  note: '',
});

describe('DocumentsPage', () => {
  it('shows placeholders, then an error, then an empty state', () => {
    gql.useClientHubSharedContentQuery.mockReturnValue({ data: undefined, loading: false });
    gql.useClientHubSharedItemsQuery.mockReturnValue({ data: undefined, loading: true });
    const { rerender } = renderWithProviders(<DocumentsPage />);
    expect(screen.getByRole('status')).toBeInTheDocument();

    gql.useClientHubSharedItemsQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('Network down'),
    });
    rerender(<DocumentsPage />);
    expect(screen.getByText('Network down')).toBeInTheDocument();

    gql.useClientHubSharedItemsQuery.mockReturnValue({
      data: { clientHubSharedItems: [] },
      loading: false,
    });
    rerender(<DocumentsPage />);
    expect(screen.getByText('Nothing shared yet')).toBeInTheDocument();
  });

  it('shows each record’s status, signature and file, and reads its text in place', async () => {
    const user = userEvent.setup();
    gql.useClientHubSharedItemsQuery.mockReturnValue({
      data: { clientHubSharedItems: [hubItem(), POLICY] },
      loading: false,
    });
    gql.useClientHubSharedContentQuery.mockImplementation(({ skip }: { skip: boolean }) =>
      skip
        ? { data: undefined, loading: false }
        : {
            data: { clientHubSharedContent: '<p>Terms</p><img src=x onerror=alert(1)>' },
            loading: false,
          },
    );
    renderWithProviders(<DocumentsPage />);

    expect(screen.getByText('Not signed yet')).toBeInTheDocument();
    expect(screen.getByText('Signed copy')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open file' })).toHaveAttribute(
      'href',
      'https://files.example/msa.pdf',
    );
    expect(screen.getAllByRole('button', { name: 'Read' })).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Read' }));
    const text = await screen.findByRole('region', { name: 'Document text' });
    expect(text).toHaveTextContent('Terms');
    expect(text.querySelector('img')?.getAttribute('onerror')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Close' }));
  });

  it('shows a reader’s loading and failure', async () => {
    const user = userEvent.setup();
    gql.useClientHubSharedItemsQuery.mockReturnValue({
      data: { clientHubSharedItems: [hubItem()] },
      loading: false,
    });
    gql.useClientHubSharedContentQuery.mockReturnValue({
      data: undefined,
      loading: true,
      error: new Error('Shared item not found'),
    });
    renderWithProviders(<DocumentsPage />);
    await user.click(screen.getByRole('button', { name: 'Read' }));

    expect(await screen.findByText('Shared item not found')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
  });
});
