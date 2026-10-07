import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { I18nProvider } from '@exyconn/i18n';
import { StatCard } from '@/components/dashboard/StatCard';
import { StatRow } from '@/components/dashboard/StatRow';

vi.mock('react-chartjs-2', () => ({
  Line: ({ data }: Readonly<{ data: { datasets: { data: number[] }[] } }>) => (
    <output data-testid="sparkline">{data.datasets[0].data.join(',')}</output>
  ),
}));

function renderIn(ui: ReactElement, messages: Record<string, string> = {}) {
  return render(
    <I18nProvider locale="en" messages={messages}>
      {ui}
    </I18nProvider>,
  );
}

describe('StatCard', () => {
  it('shows a translated label, the figure, a rising trend and its sparkline', () => {
    const { container } = renderIn(
      <StatCard
        label="Leave taken {year}"
        labelValues={{ year: 2026 }}
        value="42"
        delta={12}
        series={[1, 2, 3]}
      />,
      { 'Leave taken {year}': 'Permisos {year}' },
    );

    expect(screen.getByText('Permisos 2026')).toBeInTheDocument();
    expect(screen.getByText('42').tagName).toBe('P');
    expect(screen.getByText('12%')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="TrendingUpIcon"]')).toBeInTheDocument();
    expect(screen.getByTestId('sparkline')).toHaveTextContent('1,2,3');
  });

  it('shows a falling trend as a positive percentage with a down arrow', () => {
    const { container } = renderIn(<StatCard label="Revenue" value="₹10" delta={-8} />);

    expect(screen.getByText('8%')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="TrendingDownIcon"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="TrendingUpIcon"]')).not.toBeInTheDocument();
  });

  it('treats a flat trend as rising', () => {
    const { container } = renderIn(<StatCard label="Revenue" value="₹10" delta={0} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="TrendingUpIcon"]')).toBeInTheDocument();
  });

  it('shows no trend pill without a delta', () => {
    renderIn(<StatCard label="Revenue" value="₹10" />);
    expect(screen.queryByText(/%$/)).not.toBeInTheDocument();
    expect(screen.queryByTestId('sparkline')).not.toBeInTheDocument();
  });

  it('shows a placeholder instead of the figure and sparkline while loading', () => {
    const { container } = renderIn(<StatCard label="Revenue" value="0" series={[1, 2]} loading />);

    expect(screen.queryByText('0')).not.toBeInTheDocument();
    expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
    expect(screen.queryByTestId('sparkline')).not.toBeInTheDocument();
  });
});

describe('StatRow', () => {
  it('renders one tile per stat and passes the loading state down', () => {
    const { container, rerender } = renderIn(
      <StatRow
        stats={[
          { label: 'Open', value: '3' },
          { label: 'Closed', value: '9' },
        ]}
      />,
    );
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();

    rerender(
      <I18nProvider locale="en" messages={{}}>
        <StatRow stats={[{ label: 'Open', value: '3' }]} loading />
      </I18nProvider>,
    );
    expect(screen.queryByText('3')).not.toBeInTheDocument();
    expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
  });

  it('renders an empty row without tiles', () => {
    const { container } = renderIn(<StatRow stats={[]} />);
    expect(container.querySelector('.MuiGrid-container')?.children).toHaveLength(0);
  });
});
