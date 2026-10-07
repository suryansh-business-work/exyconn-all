import { expect } from 'vitest';
import { act } from '@testing-library/react';
import { SupportConsolePage } from '../../../../src/pages/support';
import { renderWithProviders, useCurrentUrl } from '../../test-utils';
import { dashboardProps, resetCrudPage } from '../../crud-page.mocks';
import { ticketRow } from '../../fixtures';
import { consoleGql as gql } from './console.state';

export const ROW = ticketRow();

function UrlProbe() {
  return <output aria-label="url">{useCurrentUrl()}</output>;
}

/** Signed in as agent-7, numbers still loading, every reload succeeding. */
export function resetConsole() {
  resetCrudPage();
  gql.user = { id: 'agent-7' };
  gql.refetchStats.mockReset().mockResolvedValue({ data: {} });
  gql.refetchSla.mockReset().mockResolvedValue({ data: {} });
  gql.stats.mockReturnValue({ data: undefined, loading: true, refetch: gql.refetchStats });
  gql.sla.mockReturnValue({ data: undefined, refetch: gql.refetchSla });
}

/** The console at /support/tickets, with the router's URL readable beside it. */
export const renderConsole = () =>
  renderWithProviders(
    <>
      <SupportConsolePage />
      <UrlProbe />
    </>,
    { route: '/support/tickets' },
  );

/** Presses one of a grid row's action buttons on {@link ROW}. */
export const runAction = (key: string) =>
  act(() => {
    dashboardProps().context.actions[key](ROW);
  });

/** The stats, the SLA summary and the grid all re-read: what a reload means here. */
export const expectReloaded = (times: number) => {
  expect(dashboardProps().refreshSignal).toBe(times);
  expect(gql.refetchStats).toHaveBeenCalledTimes(times);
  expect(gql.refetchSla).toHaveBeenCalledTimes(times);
};
