import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useScoreDealMutation } from '@exyconn/shell/graphql/generated';
import { DealScorePanel } from '../../../../../src/pages/deals/score/DealScorePanel';
import { renderWithProviders } from '../../../test-utils';
import { dealRow } from '../../../fixtures';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useScoreDealMutation: vi.fn(),
}));

const rescore = vi.fn();
const reason = (text: string, impact: number) => ({
  __typename: 'DealScoreReason' as const,
  text,
  impact,
});

function renderPanel(deal = dealRow(), state: { data?: unknown; loading?: boolean } = {}) {
  vi.mocked(useScoreDealMutation).mockReturnValue([
    rescore,
    { data: state.data, loading: state.loading ?? false },
  ] as never);
  renderWithProviders(<DealScorePanel deal={deal} />);
}

beforeEach(() => {
  rescore.mockReset().mockResolvedValue({ data: {} });
});

describe('DealScorePanel', () => {
  it('shows an unscored deal with no reasons and no scoring date', () => {
    renderPanel();

    expect(screen.getByText('Not scored')).toBeInTheDocument();
    expect(screen.queryByText(/^Worked out/)).not.toBeInTheDocument();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('lists every reason with its effect and when the score was worked out', () => {
    renderPanel(
      dealRow({
        score: 55,
        scoredAt: '2026-10-31T12:00:00.000Z',
        scoreReasons: [
          reason('PROPOSAL stage', 50),
          reason('Activity in the last 7 days', 10),
          reason('1 overdue task(s)', -5),
        ],
      }),
    );

    expect(screen.getByLabelText('Deal score 55 out of 100')).toBeInTheDocument();
    expect(
      screen.getByText(/^Worked out .+ from activities, time in stage and email replies\.$/),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      '+50  PROPOSAL stage',
      '+10  Activity in the last 7 days',
      '-5  1 overdue task(s)',
    ]);
  });

  it('rescores the deal on demand and shows the new score', async () => {
    renderPanel(dealRow({ id: 'deal-7' }), {
      data: {
        scoreDeal: dealRow({
          id: 'deal-7',
          score: 80,
          scoreReasons: [reason('NEGOTIATION stage', 65)],
        }),
      },
    });

    await userEvent.click(screen.getByRole('button', { name: 'Rescore now' }));

    expect(rescore).toHaveBeenCalledWith({ variables: { id: 'deal-7' } });
    expect(screen.getByLabelText('Deal score 80 out of 100')).toBeInTheDocument();
    expect(screen.getByRole('listitem')).toHaveTextContent('+65 NEGOTIATION stage');
  });

  it('says why a rescore failed', async () => {
    rescore.mockRejectedValue(new Error('You do not have access to this resource'));
    renderPanel();

    await userEvent.click(screen.getByRole('button', { name: 'Rescore now' }));

    expect(await screen.findByText('You do not have access to this resource')).toBeInTheDocument();
  });

  it('cannot be pressed again while a rescore is running', () => {
    renderPanel(dealRow(), { loading: true });

    expect(screen.getByRole('button', { name: 'Rescore now' })).toBeDisabled();
  });
});
