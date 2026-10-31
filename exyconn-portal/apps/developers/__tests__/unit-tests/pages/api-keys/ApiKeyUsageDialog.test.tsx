import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockLink } from '@apollo/client/testing';
import { ApiKeyUsageDocument } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { ApiKeyUsageDialog } from '../../../../src/pages/api-keys/ApiKeyUsageDialog';
import { apiKey } from '../integrations/integrations.fixtures';
import { drawn } from './charts.mock';

vi.mock('@exyconn/shell/components/dashboard/MetricChart', async () =>
  (await import('./charts.mock')).metricChartMock(),
);

const usage = (
  days: number,
  rows: Array<{ day: string; count: number }>,
  delay = 0,
): MockLink.MockedResponse => ({
  request: { query: ApiKeyUsageDocument, variables: { id: 'key-1', days } },
  result: {
    data: { apiKeyUsage: rows.map((row) => ({ __typename: 'ApiKeyUsageDay', ...row })) },
  },
  delay,
});

const failed = (days: number): MockLink.MockedResponse => ({
  request: { query: ApiKeyUsageDocument, variables: { id: 'key-1', days } },
  error: new Error('Network down'),
});

beforeEach(() => {
  drawn.chart = null;
});

describe('ApiKeyUsageDialog', () => {
  it('stays closed and asks for nothing without a key', () => {
    renderWithProviders(<ApiKeyUsageDialog apiKey={null} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(drawn.chart).toBeNull();
  });

  it('loads the last 30 days for the key and charts each day as a count', async () => {
    renderWithProviders(<ApiKeyUsageDialog apiKey={apiKey()} onClose={vi.fn()} />, {
      mocks: [
        usage(
          30,
          [
            { day: '2026-10-30', count: 4 },
            { day: '2026-10-31', count: 0 },
          ],
          20,
        ),
      ],
    });
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Usage — Payroll sync')).toBeInTheDocument();
    expect(within(dialog).getByRole('progressbar')).toBeInTheDocument();

    await waitFor(() => expect(drawn.chart?.metrics).toHaveLength(2));
    expect(drawn.chart?.metrics.map((metric) => metric.value)).toEqual([4, 0]);
    expect(drawn.chart?.metrics[0].label).toMatch(/30/);
    expect(drawn.chart?.metrics[1].label).toMatch(/31/);
    expect(drawn.chart?.title).toBe('Requests per day');
    expect(drawn.chart?.labelHeading).toBe('Day (UTC)');
    expect(drawn.chart?.integer).toBe(true);
    expect(drawn.chart?.formatValue(12)).toBe('12');
    expect(within(dialog).getByRole('combobox', { name: 'Period' })).toHaveTextContent(
      'Last 30 days',
    );
  });

  it('asks again for the period the person picks', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ApiKeyUsageDialog apiKey={apiKey()} onClose={vi.fn()} />, {
      mocks: [
        usage(30, [{ day: '2026-10-31', count: 1 }]),
        usage(7, [
          { day: '2026-10-30', count: 9 },
          { day: '2026-10-31', count: 3 },
        ]),
      ],
    });
    await waitFor(() => expect(drawn.chart?.metrics.map((m) => m.value)).toEqual([1]));

    await user.click(screen.getByRole('combobox', { name: 'Period' }));
    const options = within(screen.getByRole('listbox')).getAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual([
      'Last 7 days',
      'Last 30 days',
      'Last 90 days',
    ]);
    await user.click(options[0]);

    await waitFor(() => expect(drawn.chart?.metrics.map((m) => m.value)).toEqual([9, 3]));
  });

  it('says why when the usage cannot be read', async () => {
    renderWithProviders(<ApiKeyUsageDialog apiKey={apiKey()} onClose={vi.fn()} />, {
      mocks: [failed(30)],
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('Network down');
  });

  it('closes through its close button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(<ApiKeyUsageDialog apiKey={apiKey()} onClose={onClose} />, {
      mocks: [usage(30, [])],
    });
    await user.click(await screen.findByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
