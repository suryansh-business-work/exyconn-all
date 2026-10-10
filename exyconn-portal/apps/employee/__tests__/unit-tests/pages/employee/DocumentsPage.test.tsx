import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { useMyDocumentsQuery } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { queryResult } from './helpers/apollo';
import { DocumentsPage } from '../../../../src/pages/employee/DocumentsPage';

vi.mock('@exyconn/shell/hooks/useSettings', () => import('./helpers/settings'));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useMyDocumentsQuery: vi.fn(),
}));

describe('DocumentsPage', () => {
  it('lists each issued document with its type, issue date and a link that opens it', () => {
    vi.mocked(useMyDocumentsQuery).mockReturnValue(
      queryResult({
        data: {
          myDocuments: [
            {
              id: 'd1',
              kind: 'OFFER_LETTER',
              title: 'Offer letter',
              url: 'https://files.example.com/offer.pdf',
              issuedOn: '2026-01-05',
            },
          ],
        },
      }),
    );
    renderWithProviders(<DocumentsPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'My Documents' })).toBeInTheDocument();
    const [, row] = screen.getAllByRole('row');
    expect(within(row).getByText('Offer letter')).toBeInTheDocument();
    expect(within(row).getByText('OFFER LETTER')).toBeInTheDocument();
    expect(within(row).getByText('on 2026-01-05')).toBeInTheDocument();
    const link = within(row).getByRole('link', { name: 'Open' });
    expect(link).toHaveAttribute('href', 'https://files.example.com/offer.pdf');
    expect(link).toHaveAttribute('target', '_blank');
    expect(useMyDocumentsQuery).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
  });

  it('says nothing has been issued when the list is empty', () => {
    vi.mocked(useMyDocumentsQuery).mockReturnValue(queryResult({ data: { myDocuments: [] } }));
    renderWithProviders(<DocumentsPage />);
    expect(screen.getByText('No documents have been issued to you yet.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('holds the table busy and does not claim the list is empty while the first response loads', () => {
    vi.mocked(useMyDocumentsQuery).mockReturnValue(queryResult({ loading: true }));
    const { container } = renderWithProviders(<DocumentsPage />);
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(screen.queryByText('No documents have been issued to you yet.')).toBeNull();
  });
});
