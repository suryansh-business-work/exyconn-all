import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { LinksPage } from '../../../../src/pages/links/LinksPage';
import { renderWithProviders } from '../../test-utils';
import { hubLink } from '../hub-records.fixtures';

const gql = vi.hoisted(() => ({ useClientHubLinksQuery: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ...gql,
}));

describe('LinksPage', () => {
  it('shows placeholders until the links first arrive', () => {
    gql.useClientHubLinksQuery.mockReturnValue({ data: undefined, loading: true });
    renderWithProviders(<LinksPage />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('says so when the links cannot be read', () => {
    gql.useClientHubLinksQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('Network down'),
    });
    renderWithProviders(<LinksPage />);

    expect(screen.getByText('Network down')).toBeInTheDocument();
  });

  it('says there are none yet', () => {
    gql.useClientHubLinksQuery.mockReturnValue({ data: { clientHubLinks: [] }, loading: false });
    renderWithProviders(<LinksPage />);

    expect(screen.getByText('No links yet')).toBeInTheDocument();
  });

  it('shows each link with what it is for and a button that opens it in a new tab', () => {
    gql.useClientHubLinksQuery.mockReturnValue({
      data: {
        clientHubLinks: [
          hubLink(),
          hubLink({ id: 'link-2', title: 'Drive', description: '', details: '' }),
        ],
      },
      loading: false,
    });
    renderWithProviders(<LinksPage />);

    expect(screen.getByText('Work in progress')).toBeInTheDocument();
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
    const open = screen.getAllByRole('link', { name: 'Open' });
    expect(open).toHaveLength(2);
    expect(open[0]).toHaveAttribute('href', 'https://staging.acme.example');
    expect(open[0]).toHaveAttribute('target', '_blank');
  });
});
