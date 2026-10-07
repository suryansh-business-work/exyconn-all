import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { countryName } from '@exyconn/i18n';
import { PlatformAnalyticsDocument } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { PlatformSection } from '../../../../src/pages/analytics/PlatformSection';
import { drawnLabels, platform } from './analytics.fixtures';

vi.mock('react-chartjs-2', async () => {
  const { DrawnChart } = await import('./analytics.fixtures');
  return { Bar: DrawnChart, Line: DrawnChart };
});

describe('PlatformSection', () => {
  it('shows a spinner, then every organization by size, month, status and country', async () => {
    renderWithProviders(<PlatformSection />, {
      mocks: [
        {
          request: { query: PlatformAnalyticsDocument },
          result: { data: { platformAnalytics: platform() } },
          delay: 20,
        },
      ],
    });
    const section = screen.getByRole('region', { name: 'Platform' });
    expect(within(section).getByRole('progressbar')).toBeInTheDocument();

    expect(await within(section).findByText('Organizations')).toBeInTheDocument();
    expect(within(section).queryByRole('progressbar')).toBeNull();
    expect(within(section).getByText('300')).toBeInTheDocument();
    expect(within(section).getByText('250')).toBeInTheDocument();
    // Months are YYYY-MM keys and are drawn exactly as they come; an unset country says so.
    expect(drawnLabels()).toEqual(['Acme', '2026-09', 'ACTIVE', `${countryName('IN')}|Not set`]);
  });

  it('shows the error when the platform report cannot be read', async () => {
    renderWithProviders(<PlatformSection />, {
      mocks: [{ request: { query: PlatformAnalyticsDocument }, error: new Error('Forbidden') }],
    });
    expect(await screen.findByText('Forbidden')).toBeInTheDocument();
    expect(screen.queryByText('Organizations')).toBeNull();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });
});
