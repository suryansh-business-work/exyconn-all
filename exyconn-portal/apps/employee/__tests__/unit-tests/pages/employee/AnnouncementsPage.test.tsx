import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { useActiveAnnouncementsQuery } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { queryResult } from './helpers/apollo';
import { AnnouncementsPage } from '../../../../src/pages/employee/AnnouncementsPage';

vi.mock('@exyconn/shell/hooks/useSettings', () => import('./helpers/settings'));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useActiveAnnouncementsQuery: vi.fn(),
}));

const announcements = [
  {
    id: 'a1',
    title: 'Office closed Friday',
    category: 'GENERAL',
    pinned: true,
    publishedAt: '2026-03-10T09:00:00.000Z',
    body: 'Maintenance on the\nsecond floor.',
  },
  {
    id: 'a2',
    title: 'New leave policy',
    category: 'POLICY',
    pinned: false,
    publishedAt: '2026-03-01T09:00:00.000Z',
    body: 'Read it in Policies.',
  },
];

describe('AnnouncementsPage', () => {
  it('says it is loading while the first answer is on its way', () => {
    vi.mocked(useActiveAnnouncementsQuery).mockReturnValue(queryResult({ loading: true }));
    renderWithProviders(<AnnouncementsPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Announcements' })).toBeInTheDocument();
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(useActiveAnnouncementsQuery).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
  });

  it('says nothing is announced once the feed comes back empty', () => {
    vi.mocked(useActiveAnnouncementsQuery).mockReturnValue(
      queryResult({ data: { activeAnnouncements: [] } }),
    );
    renderWithProviders(<AnnouncementsPage />);
    expect(screen.getByText('Nothing announced right now.')).toBeInTheDocument();
    expect(screen.queryByText('Loading…')).toBeNull();
  });

  it('lists every announcement with its category, date and body, pinning only the pinned one', () => {
    vi.mocked(useActiveAnnouncementsQuery).mockReturnValue(
      queryResult({ data: { activeAnnouncements: announcements } }),
    );
    renderWithProviders(<AnnouncementsPage />);

    expect(screen.getByRole('heading', { name: 'Office closed Friday' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'New leave policy' })).toBeInTheDocument();
    expect(screen.getByText('GENERAL')).toBeInTheDocument();
    expect(screen.getByText('POLICY')).toBeInTheDocument();
    expect(screen.getByText('on 2026-03-10T09:00:00.000Z')).toBeInTheDocument();
    expect(screen.getByText('Read it in Policies.')).toBeInTheDocument();
    expect(screen.getAllByTestId('PushPinIcon')).toHaveLength(1);
    expect(screen.queryByText('Nothing announced right now.')).toBeNull();
  });
});
