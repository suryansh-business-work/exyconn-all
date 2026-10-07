import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { I18nProvider } from '@exyconn/i18n';
import { color } from '@exyconn/ui';
import { ModuleDashboard } from '@/components/dashboard/ModuleDashboard';

vi.mock('react-chartjs-2', () => ({
  Line: ({ data }: Readonly<{ data: { datasets: { data: number[]; borderColor: string }[] } }>) => (
    <output data-testid="sparkline" data-color={data.datasets[0].borderColor}>
      {data.datasets[0].data.join(',')}
    </output>
  ),
}));

function renderIn(ui: ReactElement, messages: Record<string, string> = {}) {
  return render(
    <I18nProvider locale="en" messages={messages}>
      {ui}
    </I18nProvider>,
  );
}

describe('ModuleDashboard', () => {
  it('lays out header, action, tiles, trend chart, table and dialog', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    renderIn(
      <ModuleDashboard
        title="Invoices"
        subtitle="{count} this month"
        subtitleValues={{ count: 4 }}
        actionLabel="New {kind}"
        actionLabelValues={{ kind: 'invoice' }}
        onAction={onAction}
        stats={[
          { label: 'Paid', value: '3' },
          { label: 'Due', value: '1' },
        ]}
        chartTitle="Billed"
        chartSeries={[4, 8, 6]}
        chartColor="#abcdef"
        dialog={<div role="dialog">dialog</div>}
      >
        <table aria-label="invoices" />
      </ModuleDashboard>,
      { Billed: 'Facturado', 'Last 16 periods': 'Últimos 16 periodos' },
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Invoices' })).toBeInTheDocument();
    expect(screen.getByText('4 this month')).toBeInTheDocument();
    expect(screen.getByText('Paid')).toBeInTheDocument();
    expect(screen.getByText('Facturado')).toBeInTheDocument();
    expect(screen.getByText('Últimos 16 periodos')).toBeInTheDocument();
    expect(screen.getByTestId('sparkline')).toHaveTextContent('4,8,6');
    expect(screen.getByTestId('sparkline')).toHaveAttribute('data-color', '#abcdef');
    expect(screen.getByRole('table', { name: 'invoices' })).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveTextContent('dialog');

    await user.click(screen.getByRole('button', { name: 'New invoice' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('draws the trend in the default accent with an untitled chart', () => {
    renderIn(
      <ModuleDashboard title="Leads" subtitle="All" stats={[]} chartSeries={[1, 2]}>
        <p>table</p>
      </ModuleDashboard>,
    );
    expect(screen.getByTestId('sparkline')).toHaveAttribute('data-color', color.orange[500]);
    expect(document.querySelector('.MuiTypography-subtitle2')).toBeEmptyDOMElement();
  });

  it('shows placeholders in the tiles while loading and no chart without a series', () => {
    const { container } = renderIn(
      <ModuleDashboard
        title="Leads"
        subtitle="All"
        stats={[{ label: 'Open', value: '7' }]}
        statsLoading
      >
        <p>table</p>
      </ModuleDashboard>,
    );
    expect(screen.queryByText('7')).not.toBeInTheDocument();
    expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
    expect(screen.queryByTestId('sparkline')).not.toBeInTheDocument();
    expect(screen.queryByText('Last 16 periods')).not.toBeInTheDocument();
  });
});
