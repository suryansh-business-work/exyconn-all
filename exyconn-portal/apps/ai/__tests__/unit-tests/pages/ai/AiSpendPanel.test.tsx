import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AiSpendSummaryQuery } from '@exyconn/shell/graphql/generated';
import { AiSpendPanel } from '../../../../src/pages/ai/AiSpendPanel';
import { renderWithProviders } from '../../test-utils';

type Summary = AiSpendSummaryQuery['aiSpendSummary'];

const SUMMARY: Summary = {
  totalUsd: 1.23456,
  byUser: [
    { userId: 'u1', name: 'Asha', usd: 1.2, jobs: 1200 },
    { userId: '', name: 'Unattributed', usd: 0.03456, jobs: 3 },
  ],
  byModel: [
    { model: 'gpt-4o', usd: 1.2, jobs: 1200 },
    { model: 'gpt-4o-mini', usd: 0.03456, jobs: 3 },
  ],
};

const PRICES = 'Prices come from Tech › Environment Variables › AI Pricing.';

const tables = () => screen.getAllByRole('table');

describe('AiSpendPanel', () => {
  it('splits the spend by person and by model, to four decimals', () => {
    renderWithProviders(
      <AiSpendPanel
        summary={SUMMARY}
        loading={false}
        onRefresh={vi.fn()}
        periodLabel="this month"
      />,
    );
    expect(screen.getByText('Spend this month')).toBeInTheDocument();
    expect(screen.getByText(`$1.2346 across 2 models. ${PRICES}`)).toBeInTheDocument();
    const [byUser, byModel] = tables();
    expect(within(byUser).getByText('Asha')).toBeInTheDocument();
    expect(within(byUser).getByText('Unattributed')).toBeInTheDocument();
    expect(within(byUser).getByText((1200).toLocaleString())).toBeInTheDocument();
    expect(within(byUser).getByText('$0.0346')).toBeInTheDocument();
    expect(within(byModel).getByText('gpt-4o-mini')).toBeInTheDocument();
    expect(within(byModel).getByText('$1.2000')).toBeInTheDocument();
  });

  it('says "1 model" as its own sentence', () => {
    const one: Summary = { ...SUMMARY, totalUsd: 1.2, byModel: [SUMMARY.byModel[0]] };
    renderWithProviders(
      <AiSpendPanel summary={one} loading={false} onRefresh={vi.fn()} periodLabel="this month" />,
    );
    expect(screen.getByText(`$1.2000 across 1 model. ${PRICES}`)).toBeInTheDocument();
  });

  it('keeps a run with no model on file as its own row', () => {
    const unknown: Summary = {
      ...SUMMARY,
      byModel: [{ model: '', usd: 0.5, jobs: 2 }, SUMMARY.byModel[0]],
    };
    renderWithProviders(
      <AiSpendPanel summary={unknown} loading={false} onRefresh={vi.fn()} periodLabel="today" />,
    );
    expect(within(tables()[1]).getByText('$0.5000')).toBeInTheDocument();
    expect(screen.getByText('Spend today')).toBeInTheDocument();
  });

  it('shows a zero total and an empty state for both tables when nothing was spent', () => {
    renderWithProviders(
      <AiSpendPanel loading={false} onRefresh={vi.fn()} periodLabel="this month" />,
    );
    expect(screen.getByText(`$0.0000 across 0 models. ${PRICES}`)).toBeInTheDocument();
    expect(screen.getAllByText('Nothing spent in this period.')).toHaveLength(2);
  });

  it('re-reads the summary from either table', async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(
      <AiSpendPanel
        summary={SUMMARY}
        loading={false}
        onRefresh={onRefresh}
        periodLabel="this month"
      />,
    );
    const [first, second] = screen.getAllByRole('button', { name: 'Refresh table' });
    await user.click(first);
    await user.click(second);
    expect(onRefresh).toHaveBeenCalledTimes(2);
  });

  it('holds the refresh while the summary is loading', () => {
    renderWithProviders(
      <AiSpendPanel summary={SUMMARY} loading onRefresh={vi.fn()} periodLabel="this month" />,
    );
    for (const button of screen.getAllByRole('button', { name: 'Refresh table' })) {
      expect(button).toBeDisabled();
    }
    expect(screen.queryByText('Asha')).not.toBeInTheDocument();
  });
});
