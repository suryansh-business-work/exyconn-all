import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { RecentAnalyses } from '../../../../../src/pages/security/sonar/RecentAnalyses';
import { renderWithProviders } from '../../../test-utils';

vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('../use-settings.mock')).settingsModule(),
);

describe('RecentAnalyses', () => {
  it('says when no analysis has run', () => {
    renderWithProviders(<RecentAnalyses analyses={[]} />);
    expect(screen.getByRole('heading', { name: 'Recent analyses' })).toBeInTheDocument();
    expect(screen.getByText('No analysis has run yet.')).toBeInTheDocument();
  });

  it('lists each analysis with its time, version and events', () => {
    renderWithProviders(
      <RecentAnalyses
        analyses={[
          {
            key: 'A2',
            date: '2026-10-04T10:00:00.000Z',
            version: '1.9.8',
            events: ['Passed', 'Version 1.9.8'],
          },
          { key: 'A1', date: '2026-10-03T10:00:00.000Z', version: '', events: [] },
        ]}
      />,
    );
    expect(screen.queryByText('No analysis has run yet.')).not.toBeInTheDocument();
    expect(screen.getByText('at(2026-10-04T10:00:00.000Z)')).toBeInTheDocument();
    expect(screen.getByText('1.9.8')).toBeInTheDocument();
    expect(screen.getByText('Passed')).toBeInTheDocument();
    expect(screen.getByText('Version 1.9.8')).toBeInTheDocument();
    const older = screen.getByText('at(2026-10-03T10:00:00.000Z)');
    expect(older.parentElement?.children).toHaveLength(1);
  });
});
