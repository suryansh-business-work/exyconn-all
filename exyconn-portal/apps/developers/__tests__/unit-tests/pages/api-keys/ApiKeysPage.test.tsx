import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiKeyUsageDocument, ListApiKeysDocument } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { ApiKeysPage } from '../../../../src/pages/api-keys/ApiKeysPage';
import { apiKey } from '../integrations/integrations.fixtures';
import { drawn } from './charts.mock';

vi.mock('@exyconn/shell/components/dashboard/MetricChart', async () =>
  (await import('./charts.mock')).metricChartMock(),
);

describe('ApiKeysPage', () => {
  it('lists the keys and opens the usage of the one asked about, until closed', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ApiKeysPage />, {
      mocks: [
        { request: { query: ListApiKeysDocument }, result: { data: { listApiKeys: [apiKey()] } } },
        {
          request: { query: ApiKeyUsageDocument, variables: { id: 'key-1', days: 30 } },
          result: {
            data: {
              apiKeyUsage: [{ __typename: 'ApiKeyUsageDay', day: '2026-10-31', count: 7 }],
            },
          },
        },
      ],
    });
    expect(screen.getByRole('heading', { name: 'API keys' })).toBeInTheDocument();
    const row = (await screen.findByText('Payroll sync')).closest('tr') as HTMLElement;
    expect(screen.queryByRole('dialog')).toBeNull();

    await user.click(within(row).getByRole('button', { name: 'Show daily usage' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Usage — Payroll sync')).toBeInTheDocument();
    await waitFor(() => expect(drawn.chart?.metrics.map((m) => m.value)).toEqual([7]));

    await user.click(within(dialog).getByRole('button', { name: /close/i }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});
