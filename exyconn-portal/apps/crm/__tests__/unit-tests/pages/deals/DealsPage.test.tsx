import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import type { DndContext as DndContextType } from '@dnd-kit/core';
import { DealStage } from '@exyconn/shell/graphql/generated';
import { DealsPage } from '../../../../src/pages/deals';
import { renderWithProviders } from '../../test-utils';
import { dealRow, pending } from '../../fixtures';

const gql = vi.hoisted(() => ({ deals: vi.fn(), refetch: vi.fn(), setStage: vi.fn() }));

/** The board's drag handlers, as it hands them to dnd-kit — a jsdom page has no layout to drag in. */
const dnd = vi.hoisted(() => ({ props: {} as ComponentProps<typeof DndContextType> }));

vi.mock('@dnd-kit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dnd-kit/core')>();
  return {
    ...actual,
    DndContext: (props: ComponentProps<typeof actual.DndContext>) => {
      dnd.props = props;
      return <actual.DndContext {...props} />;
    },
  };
});

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListDealsQuery: () => gql.deals(),
  useSetDealStageMutation: () => [gql.setStage],
}));

vi.mock('../../../../src/pages/deals/forms/deal', async () => ({
  DealForm: (await import('../../form-stub')).FormStub,
}));

const DEALS = [
  dealRow({ id: 'deal-1', title: 'Acme rollout', stage: DealStage.Proposal }),
  dealRow({ id: 'deal-2', title: 'Globex pilot', stage: DealStage.Won }),
  dealRow({ id: 'deal-3', title: 'Initech audit', stage: DealStage.Proposal }),
];

/** The board column headed by `stage`. */
const column = (stage: string) =>
  screen.getByText(stage, { selector: 'h6' }).parentElement?.parentElement as HTMLElement;

/** Carries a deal onto a stage column and lets go, the way dnd-kit reports it. */
const dropOn = (stage: string, dealId: string) => {
  const active = { id: dealId, rect: { current: { translated: null } } };
  const over = { id: stage, rect: { top: 0, height: 0 } };
  act(() => dnd.props.onDragStart?.({ active } as never));
  act(() => dnd.props.onDragOver?.({ active, over } as never));
  act(() => dnd.props.onDragEnd?.({ active, over } as never));
};

describe('DealsPage board', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.setStage.mockResolvedValue({ data: { setDealStage: { id: 'deal-1' } } });
    gql.deals.mockReturnValue({ data: { listDeals: DEALS }, loading: false, refetch: gql.refetch });
  });

  it('says the pipeline is loading before the deals arrive', () => {
    gql.deals.mockReturnValue(pending());
    renderWithProviders(<DealsPage />, { route: '/deals' });

    expect(screen.getByRole('status')).toHaveTextContent('Loading the pipeline');
    expect(screen.getAllByTestId('skeleton-deal-column')).toHaveLength(6);
    expect(screen.queryByText('Nothing here.')).not.toBeInTheDocument();
  });

  it('lays the deals out in their stage columns', () => {
    renderWithProviders(<DealsPage />, { route: '/deals' });

    expect(screen.getByRole('heading', { level: 1, name: 'Deals' })).toBeInTheDocument();
    expect(screen.getByText('3 open and closed opportunities')).toBeInTheDocument();
    const proposal = within(column('Proposal'));
    expect(proposal.getByRole('button', { name: /^Acme rollout/ })).toBeInTheDocument();
    expect(proposal.getByRole('button', { name: /^Initech audit/ })).toBeInTheDocument();
    expect(
      within(column('Won')).getByRole('button', { name: /^Globex pilot/ }),
    ).toBeInTheDocument();
    expect(within(column('Qualifying')).getByText('Nothing here.')).toBeInTheDocument();
  });

  it('ignores a deal whose stage is not on the board', () => {
    const stray = dealRow({ id: 'deal-9', title: 'Stray', stage: 'ARCHIVED' as DealStage });
    gql.deals.mockReturnValue({
      data: { listDeals: [stray] },
      loading: false,
      refetch: gql.refetch,
    });
    renderWithProviders(<DealsPage />, { route: '/deals' });

    expect(screen.getByText('1 open and closed opportunities')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Stray/ })).not.toBeInTheDocument();
  });

  it('moves a dropped deal to the new stage and reloads the board', async () => {
    renderWithProviders(<DealsPage />, { route: '/deals' });

    dropOn(DealStage.Negotiation, 'deal-1');

    await waitFor(() =>
      expect(gql.setStage).toHaveBeenCalledWith({
        variables: { id: 'deal-1', stage: DealStage.Negotiation },
      }),
    );
    expect(await screen.findByText('"Acme rollout" moved to Negotiation')).toBeInTheDocument();
    await waitFor(() => expect(gql.refetch).toHaveBeenCalledTimes(1));
  });

  it('does nothing when a deal is dropped on its own stage or is unknown', () => {
    renderWithProviders(<DealsPage />, { route: '/deals' });

    dropOn(DealStage.Proposal, 'deal-1');
    dropOn(DealStage.Lost, 'deal-404');

    expect(gql.setStage).not.toHaveBeenCalled();
    expect(gql.refetch).not.toHaveBeenCalled();
  });

  it('reports a move the server refuses, without reloading', async () => {
    gql.setStage.mockRejectedValueOnce(new Error('Won deals are locked'));
    renderWithProviders(<DealsPage />, { route: '/deals' });

    dropOn(DealStage.Lost, 'deal-2');

    expect(await screen.findByText('Won deals are locked')).toBeInTheDocument();
    expect(gql.refetch).not.toHaveBeenCalled();
    // The card goes back to the stage the deal is really in.
    await waitFor(() =>
      expect(within(column('Won')).getByRole('button', { name: /^Globex pilot/ })).toBeVisible(),
    );
    expect(within(column('Lost')).queryByRole('button', { name: /^Globex pilot/ })).toBeNull();
  });

  it('falls back to a generic message for a failure that is not an Error', async () => {
    gql.setStage.mockRejectedValueOnce('timeout');
    renderWithProviders(<DealsPage />, { route: '/deals' });

    dropOn(DealStage.Discovery, 'deal-1');

    expect(await screen.findByText('Could not move the deal')).toBeInTheDocument();
  });
});

describe('DealsPage forms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.deals.mockReturnValue({ data: { listDeals: DEALS }, loading: false, refetch: gql.refetch });
  });

  it('opens a blank new-deal page and goes back to the board', async () => {
    renderWithProviders(<DealsPage />, { route: '/deals' });

    await userEvent.click(screen.getByRole('button', { name: 'New deal' }));
    expect(screen.getByRole('heading', { level: 1, name: 'New deal' })).toBeInTheDocument();
    expect(screen.getByText('Blank form')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Back to Deals' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Deals' })).toBeInTheDocument();
  });

  it('opens a card for editing and closes it on cancel', async () => {
    renderWithProviders(<DealsPage />, { route: '/deals' });

    await userEvent.click(screen.getByRole('button', { name: /^Globex pilot/ }));
    expect(screen.getByRole('heading', { level: 1, name: 'Edit deal' })).toBeInTheDocument();
    expect(screen.getByText(/"id":"deal-2"/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));
    expect(screen.getByRole('button', { name: /^Globex pilot/ })).toBeInTheDocument();
    expect(gql.refetch).not.toHaveBeenCalled();
  });

  it('returns to the board and reloads it once a deal is saved', async () => {
    renderWithProviders(<DealsPage />, { route: '/deals' });

    await userEvent.click(screen.getByRole('button', { name: 'New deal' }));
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Deals' })).toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('stays on the board when the reload after a save fails', async () => {
    gql.refetch.mockRejectedValueOnce(new Error('offline'));
    renderWithProviders(<DealsPage />, { route: '/deals' });

    await userEvent.click(screen.getByRole('button', { name: /^Acme rollout/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));

    await waitFor(() => expect(gql.refetch).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('heading', { level: 1, name: 'Deals' })).toBeInTheDocument();
  });
});
