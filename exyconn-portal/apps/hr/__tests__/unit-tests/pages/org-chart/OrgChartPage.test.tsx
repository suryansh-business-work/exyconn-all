import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrgChartPage } from '../../../../src/pages/org-chart';
import { renderWithProviders, useCurrentUrl } from '../../test-utils';
import { COMPANY, orgPerson } from './org-people';

const gql = vi.hoisted(() => ({
  chart: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useOrgChartQuery: (options: unknown) => gql.chart(options),
}));

vi.mock('@xyflow/react', async () => (await import('./xyflow-stub')).xyflowMock);

const EMPTY_CHART = 'No reporting lines yet — set “Reports to” on an employee record.';

function UrlProbe() {
  return <output aria-label="url">{useCurrentUrl()}</output>;
}

function renderPage() {
  renderWithProviders(
    <>
      <OrgChartPage />
      <UrlProbe />
    </>,
    { route: '/hr/org-chart' },
  );
}

describe('OrgChartPage', () => {
  beforeEach(() => {
    gql.chart.mockReset().mockReturnValue({ data: { orgChart: COMPANY }, loading: false });
  });

  it('reads the chart fresh from the network as well as the cache', () => {
    renderPage();

    expect(gql.chart).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
    expect(screen.getByRole('heading', { name: 'Org Chart' })).toBeInTheDocument();
  });

  it('says it is loading in both panels before the first answer', () => {
    gql.chart.mockReturnValue({ data: undefined, loading: true });
    renderPage();

    expect(screen.getAllByText('Loading…')).toHaveLength(2);
  });

  it('explains how to start a chart when nobody reports to anybody yet', () => {
    gql.chart.mockReturnValue({ data: { orgChart: [] }, loading: false });
    renderPage();

    expect(screen.getByText(EMPTY_CHART)).toBeInTheDocument();
    expect(screen.getByText('Everyone is placed.')).toBeInTheDocument();
  });

  it('draws the reporting lines and lists the people with no manager apart', () => {
    renderPage();

    expect(screen.getByRole('button', { name: 'Open Maya Iyer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open Dev' })).toBeInTheDocument();
    expect(screen.getByText('Omar')).toBeInTheDocument();
    expect(screen.queryByText(EMPTY_CHART)).not.toBeInTheDocument();
    expect(screen.queryByText('Everyone is placed.')).not.toBeInTheDocument();
  });

  it('says everyone is placed once each person sits in a reporting line', () => {
    gql.chart.mockReturnValue({
      data: { orgChart: [orgPerson('m', 'Maya'), orgPerson('a', 'Asha', 'm')] },
      loading: false,
    });
    renderPage();

    expect(screen.getByText('Everyone is placed.')).toBeInTheDocument();
  });

  it("opens a person's employee record from the chart", async () => {
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Open Chen' }));

    expect(screen.getByRole('status', { name: 'url' })).toHaveTextContent('/hr/employees/c');
  });

  it('opens an unplaced person from the list beside the chart', async () => {
    renderPage();

    await userEvent.click(screen.getByText('Omar'));

    expect(screen.getByRole('status', { name: 'url' })).toHaveTextContent('/hr/employees/o');
  });
});
