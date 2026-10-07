import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { KpiCards } from '../../../../src/admin/analytics/KpiCards';
import { renderWithProviders } from '../../test-utils';
import { demoStats } from '../admin.fixtures';

/** Each row of tiles as "label = value" lines, marked when the row is still loading. */
vi.mock('@exyconn/shell/components/dashboard/StatRow', () => ({
  StatRow: ({ stats, loading }: Readonly<{ stats: readonly StatItem[]; loading: boolean }>) => (
    <ul aria-label={loading ? 'loading row' : 'row'}>
      {stats.map((stat) => (
        <li key={stat.label}>{`${stat.label} = ${stat.value}`}</li>
      ))}
    </ul>
  ),
}));

const lines = () => screen.getAllByRole('listitem').map((item) => item.textContent);

describe('KpiCards', () => {
  it('shows who came, how the flows went and how the AI behaved', () => {
    renderWithProviders(<KpiCards stats={demoStats()} loading={false} />);
    expect(screen.getAllByRole('list', { name: 'row' })).toHaveLength(3);
    expect(lines()).toEqual([
      'Sessions = 12',
      'Unique users = 9',
      'Avg session duration = 45s',
      'Flows started = 20',
      'Flows completed = 15',
      'Completion rate = 75%',
      'AI calls = 8',
      'AI failure rate = 25%',
      'AI avg latency = 1,200 ms',
    ]);
  });

  it('reports no AI failure rate when there were no AI calls', () => {
    renderWithProviders(
      <KpiCards
        stats={demoStats({ ai: { calls: 0, failures: 0, avgLatencyMs: 0, tokens: 0 } })}
        loading={false}
      />,
    );
    expect(lines()).toContain('AI failure rate = 0%');
  });

  it('leaves every figure blank for the skeleton while the stats load', () => {
    renderWithProviders(<KpiCards stats={undefined} loading />);
    expect(screen.getAllByRole('list', { name: 'loading row' })).toHaveLength(3);
    expect(lines().every((line) => line?.endsWith(' = '))).toBe(true);
  });
});
