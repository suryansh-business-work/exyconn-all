import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import type { MockLink } from '@apollo/client/testing';
import { ListWebhookDeliveriesStatsDocument } from '@exyconn/shell/graphql/generated';
import { DeliveriesPage } from '../../../../src/pages/deliveries/DeliveriesPage';
import { DELIVERY_COLUMNS } from '../../../../src/pages/deliveries/deliveries-grid';
import { dashboard, dashboardProps } from '../../crud-dashboard-stub';
import { renderWithProviders } from '../../test-utils';
import { delivery } from './delivery.fixtures';

const crud = vi.hoisted(() => ({
  document: null as unknown,
  select: null as null | ((data: unknown) => unknown),
  fetchRows: vi.fn(),
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const { CrudDashboardStub } = await import('../../crud-dashboard-stub');
  return {
    ...(await importOriginal<Record<string, unknown>>()),
    CrudDashboard: CrudDashboardStub,
    usePagedFetcher: (document: unknown, select: (data: unknown) => unknown) => {
      crud.document = document;
      crud.select = select;
      return crud.fetchRows;
    },
  };
});

const bucket = (value: string, count: number) => ({ __typename: 'StatBucket', value, count });

const stats = (delay = 0): MockLink.MockedResponse => ({
  request: { query: ListWebhookDeliveriesStatsDocument },
  result: {
    data: {
      listWebhookDeliveriesStats: {
        __typename: 'TableStats',
        total: 12,
        counts: [
          {
            __typename: 'StatFieldCounts',
            field: 'status',
            buckets: [
              bucket('DELIVERED', 7),
              bucket('PENDING', 1),
              bucket('FAILED', 2),
              bucket('DEAD', 2),
            ],
          },
        ],
        sums: [],
      },
    },
  },
  delay,
});

const statValues = () => dashboardProps().stats.map((stat) => [stat.label, stat.value]);

beforeEach(() => {
  dashboard.props = null;
});

describe('DeliveriesPage', () => {
  it('counts deliveries by outcome once the stats arrive, retrying being pending plus failed', async () => {
    renderWithProviders(<DeliveriesPage />, { mocks: [stats(20)] });
    expect(dashboardProps().statsLoading).toBe(true);
    expect(statValues()).toEqual([
      ['Deliveries', '0'],
      ['Delivered', '0'],
      ['Retrying', '0'],
      ['Given up', '0'],
    ]);

    await waitFor(() => expect(dashboardProps().statsLoading).toBe(false));
    expect(statValues()).toEqual([
      ['Deliveries', '12'],
      ['Delivered', '7'],
      ['Retrying', '3'],
      ['Given up', '2'],
    ]);
  });

  it('hands the grid its columns and pages through the delivery log', () => {
    renderWithProviders(<DeliveriesPage />, { mocks: [stats()] });
    const props = dashboardProps();
    expect(props.title).toBe('Delivery log');
    expect(props.entityLabel).toBe('delivery');
    expect(props.exportFileName).toBe('webhook-deliveries');
    expect(props.columnDefs).toBe(DELIVERY_COLUMNS);
    expect(props.fetchRows).toBe(crud.fetchRows);
    const page = { rows: [delivery()], totalCount: 1 };
    expect(crud.select?.({ listWebhookDeliveriesPaged: page })).toBe(page);
    expect(props.context.formatDate('2026-10-31T10:00:00.000Z')).toMatch(/2026/);
  });

  it('opens a delivery from a row click or the view action, and closes it', async () => {
    renderWithProviders(<DeliveriesPage />, { mocks: [stats()] });
    expect(screen.queryByRole('dialog')).toBeNull();

    act(() => dashboardProps().onRowClick?.(delivery() as never));
    let dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('invoice.paid')).toBeInTheDocument();

    act(() => within(dialog).getByRole('button', { name: /close/i }).click());
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    act(() => dashboardProps().context.actions.view(delivery({ event: 'deal.won' }) as never));
    dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('deal.won')).toBeInTheDocument();
  });
});
