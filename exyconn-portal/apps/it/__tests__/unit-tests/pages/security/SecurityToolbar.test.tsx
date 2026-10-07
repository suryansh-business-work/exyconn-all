import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { SecurityToolbar } from '../../../../src/pages/security/SecurityToolbar';
import { renderWithProviders } from '../../test-utils';
import { tableStats } from '../page-kit/fixtures';

const gql = vi.hoisted(() => ({ assets: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListAssetsStatsQuery: () => gql.assets(),
}));

const edr = { edrStatus: { PROTECTED: 7, UNPROTECTED: 2, OUTDATED: 3 } };

describe('SecurityToolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.assets.mockReturnValue({ data: { listAssetsStats: tableStats(12, edr) }, loading: false });
  });

  it('counts the devices in each endpoint protection state', () => {
    renderWithProviders(<SecurityToolbar />);

    expect(screen.getByText('Endpoint protection')).toBeInTheDocument();
    for (const label of ['NOT APPLICABLE', 'OUTDATED', 'PROTECTED', 'UNPROTECTED']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('shows placeholders instead of counts until the stats arrive', () => {
    gql.assets.mockReturnValue({ data: undefined, loading: true });
    const { container } = renderWithProviders(<SecurityToolbar />);

    expect(container.querySelectorAll('.MuiSkeleton-root')).toHaveLength(4);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('shows zero counts when the stats could not be read', () => {
    gql.assets.mockReturnValue({ data: undefined, loading: false });
    renderWithProviders(<SecurityToolbar />);

    expect(screen.getAllByText('0')).toHaveLength(4);
  });

  it('links to the other security registers', () => {
    renderWithProviders(<SecurityToolbar />);

    expect(screen.getByRole('link', { name: 'Security incidents' })).toHaveAttribute(
      'href',
      '/it/incidents',
    );
    expect(screen.getByRole('link', { name: 'Security policies' })).toHaveAttribute(
      'href',
      '/it/policies',
    );
    expect(screen.getByRole('link', { name: 'Device register' })).toHaveAttribute(
      'href',
      '/it/assets',
    );
  });
});
