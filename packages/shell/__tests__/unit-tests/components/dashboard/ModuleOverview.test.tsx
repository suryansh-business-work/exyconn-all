import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { I18nProvider } from '@exyconn/i18n';
import { ModuleOverview } from '@/components/dashboard/ModuleOverview';

vi.mock('react-chartjs-2', () => ({
  Bar: ({ data }: Readonly<{ data: { labels: string[] } }>) => (
    <output data-testid="breakdown">{data.labels.join(',')}</output>
  ),
}));

function renderAt(ui: ReactElement, messages: Record<string, string> = {}) {
  return render(
    <I18nProvider locale="en" messages={messages}>
      <MemoryRouter initialEntries={['/crm']}>
        <Routes>
          <Route path="/crm" element={ui} />
          <Route path="/crm/leads" element={<p>leads page</p>} />
        </Routes>
      </MemoryRouter>
    </I18nProvider>,
  );
}

describe('ModuleOverview', () => {
  it('shows the numbers, their breakdowns, the links and the recent records', async () => {
    const user = userEvent.setup();
    renderAt(
      <ModuleOverview
        title="CRM"
        subtitle="Pipeline at a glance"
        stats={[{ label: 'Leads', value: '12' }]}
        breakdowns={[
          {
            title: 'By {field}',
            titleValues: { field: 'stage' },
            buckets: [{ value: 'NEW', count: 3 }],
            accent: '#111111',
          },
          { title: 'By owner', buckets: [{ value: 'ASHA', count: 2 }] },
        ]}
        links={[{ label: 'All leads', to: '/crm/leads' }]}
        recentTitle="Newest leads"
      >
        <p>recent rows</p>
      </ModuleOverview>,
      { 'All leads': 'Todos los clientes', 'Newest leads': 'Últimos clientes' },
    );

    expect(screen.getByRole('heading', { level: 1, name: 'CRM' })).toBeInTheDocument();
    expect(screen.getByText('Pipeline at a glance')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'By stage' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'By owner' })).toBeInTheDocument();
    expect(screen.getAllByTestId('breakdown').map((chart) => chart.textContent)).toEqual([
      'New',
      'Asha',
    ]);
    expect(screen.getByText('Últimos clientes')).toBeInTheDocument();
    expect(screen.getByText('recent rows')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Todos los clientes' }));
    expect(screen.getByText('leads page')).toBeInTheDocument();
  });

  it('shows only the header and tiles when there is nothing else, loading placeholders first', () => {
    const { container } = renderAt(
      <ModuleOverview
        title="CRM"
        subtitle="Pipeline"
        stats={[{ label: 'Leads', value: '12' }]}
        statsLoading
      />,
    );

    expect(screen.queryByText('12')).not.toBeInTheDocument();
    expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
    expect(screen.queryByTestId('breakdown')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByText('Recent')).not.toBeInTheDocument();
  });

  it('heads the recent records Recent by default', () => {
    renderAt(
      <ModuleOverview title="CRM" subtitle="Pipeline" stats={[]}>
        <p>recent rows</p>
      </ModuleOverview>,
    );
    expect(screen.getByText('Recent')).toBeInTheDocument();
  });
});
