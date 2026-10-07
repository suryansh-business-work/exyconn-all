import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { StatusStats } from '../../../../src/pages/status/StatusStats';
import { renderWithProviders } from '../../test-utils';
import { dayPoint, overview } from './status.fixtures';

describe('StatusStats', () => {
  it('reports the four headline numbers once there are checks today', () => {
    renderWithProviders(
      <StatusStats
        overview={overview({ total: 12, uptimeToday: 99.54, uptime30d: 98, avgResponseMs: 240 })}
      />,
    );
    expect(screen.getByText('Services monitored')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('99.5%')).toBeInTheDocument();
    expect(screen.getByText('98.0%')).toBeInTheDocument();
    expect(screen.getByText('240 ms')).toBeInTheDocument();
  });

  it('shows dashes, not zeros, before anything has been measured', () => {
    renderWithProviders(
      <StatusStats
        overview={overview({ daily: [dayPoint('2026-09-03', 0)], uptimeToday: 0, uptime30d: 0 })}
      />,
    );
    expect(screen.getAllByText('—')).toHaveLength(3);
    expect(screen.queryByText('0.0%')).not.toBeInTheDocument();
  });

  it('keeps the 30-day figure when only today is still unmeasured', () => {
    renderWithProviders(
      <StatusStats
        overview={overview({
          daily: [dayPoint('2026-09-02', 288), dayPoint('2026-09-03', 0)],
          uptime30d: 100,
        })}
      />,
    );
    expect(screen.getByText('100.0%')).toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(2);
  });

  it('treats an empty history as unmeasured', () => {
    renderWithProviders(<StatusStats overview={overview({ daily: [] })} />);
    expect(screen.getAllByText('—')).toHaveLength(3);
  });
});
