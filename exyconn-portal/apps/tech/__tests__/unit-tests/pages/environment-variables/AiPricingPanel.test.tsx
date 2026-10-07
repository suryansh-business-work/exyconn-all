import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AiPricingPanel } from '../../../../src/pages/environment-variables/AiPricingPanel';
import { renderWithProviders } from '../../test-utils';
import { describeConfigPanel } from './config-panel.suite';
import { forms, resetHarness } from './panel.harness';

const gql = vi.hoisted(() => ({
  list: vi.fn(),
  remove: vi.fn(),
  limit: vi.fn(),
  refetchLimit: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListAiModelPricesQuery: gql.list,
  useAiSpendLimitQuery: gql.limit,
  useDeleteAiModelPriceMutation: () => [gql.remove],
}));
vi.mock('@exyconn/crud', async () => (await import('./panel.harness')).crudModule());
vi.mock('@exyconn/shell/components/data/DataTable', async () =>
  (await import('./panel.harness')).dataTableModule(),
);
vi.mock('../../../../src/pages/environment-variables/forms/ai-model-price', async () =>
  (await import('./panel.harness')).formModule('AiModelPriceForm'),
);
vi.mock('../../../../src/pages/environment-variables/forms/ai-spend-limit', async () =>
  (await import('./panel.harness')).formModule('AiSpendLimitForm'),
);

const BUDGET = { monthlyUsdCap: 250, perUserDailyUsdCap: 5, enabled: true };

const ROWS = [
  {
    id: 'price-1',
    model: 'gpt-4o-mini',
    inputPer1kUsd: 0.00015,
    outputPer1kUsd: 0.0006,
    active: true,
    updatedAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'price-2',
    model: 'gpt-3.5-turbo',
    inputPer1kUsd: 0.0005,
    outputPer1kUsd: 0.0015,
    active: false,
    updatedAt: '2026-09-02T00:00:00.000Z',
  },
];

gql.limit.mockReturnValue({ data: undefined, refetch: gql.refetchLimit });

describeConfigPanel({
  name: 'AiPricingPanel',
  Panel: AiPricingPanel,
  listQuery: gql.list,
  listKey: 'listAiModelPrices',
  rows: ROWS,
  cells: {
    'price-1': ['gpt-4o-mini', '$0.000150', '$0.000600', 'Yes'],
    'price-2': ['gpt-3.5-turbo', '$0.000500', '$0.001500', 'No'],
  },
  deleteMutation: gql.remove,
  label: 'AI model price',
  confirm: 'Delete the price for "{model}"?',
  confirmValues: { model: 'gpt-4o-mini' },
  title: 'AI pricing',
  actionLabel: 'New model price',
  emptyMessage: 'No model prices yet.',
  form: 'AiModelPriceForm',
  newTitle: 'New model price',
  editTitle: 'Edit model price',
  backLabel: 'Back to AI pricing',
});

describe('AiPricingPanel budget', () => {
  beforeEach(() => {
    resetHarness();
    gql.refetchLimit.mockReset();
    gql.list.mockReturnValue({ data: { listAiModelPrices: ROWS }, loading: false });
  });

  it('says the budget is loading until it arrives', () => {
    gql.limit.mockReturnValue({ data: undefined, refetch: gql.refetchLimit });
    renderWithProviders(<AiPricingPanel />);
    expect(screen.getByRole('heading', { level: 1, name: 'AI budget' })).toBeInTheDocument();
    expect(screen.getByText('Loading the budget…')).toBeInTheDocument();
    expect(screen.queryByTestId('AiSpendLimitForm')).not.toBeInTheDocument();
  });

  it('edits the stored budget and re-reads it after a save or a cancel', async () => {
    gql.limit.mockReturnValue({ data: { aiSpendLimit: BUDGET }, refetch: gql.refetchLimit });
    renderWithProviders(<AiPricingPanel />);
    expect(forms.AiSpendLimitForm?.initial).toEqual(BUDGET);
    expect(screen.queryByText('Loading the budget…')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'stub done' }));
    await userEvent.click(screen.getByRole('button', { name: 'stub cancel' }));
    expect(gql.refetchLimit).toHaveBeenCalledTimes(2);
  });
});
