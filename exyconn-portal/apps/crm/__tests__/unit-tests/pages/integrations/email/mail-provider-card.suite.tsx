import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { renderWithProviders } from '../../../test-utils';
import { press } from '../../../form-helpers';

/** What makes the Gmail and Microsoft cards different. */
export interface MailProviderCardSpec {
  name: string;
  render: (ready: boolean) => ReactElement;
  /** The accounts query stand-in and the keys its list and readiness sit under. */
  query: Mock;
  listKey: string;
  readyKey: string;
  /** A connected mailbox at sales@acme.io. */
  account: Record<string, unknown>;
  actions: { connect: Mock };
  title: string;
  connectLabel: string;
  empty: string;
  loading: string;
}

/** The behaviour every mail provider card on Integrations > Email shares. */
export function describeMailProviderCard(spec: Readonly<MailProviderCardSpec>) {
  const refetch = vi.fn();
  const answer = (accounts: unknown[], clientReady = true) =>
    spec.query.mockReturnValue({
      data: { [spec.listKey]: accounts, [spec.readyKey]: clientReady },
      loading: false,
      error: undefined,
      refetch,
    });
  const connectButton = () => screen.getByRole('button', { name: spec.connectLabel });

  describe(spec.name, () => {
    beforeEach(() => {
      vi.clearAllMocks();
      vi.restoreAllMocks();
      spec.actions.connect.mockResolvedValue(undefined);
      refetch.mockResolvedValue({});
    });

    it('shows its status and lists each connected mailbox', () => {
      answer([spec.account]);
      renderWithProviders(spec.render(true));

      const card = within(screen.getByRole('region', { name: spec.title }));
      const header = within(screen.getByRole('heading', { name: spec.title }).parentElement!);
      expect(header.getByText('Connected')).toBeInTheDocument();
      expect(card.getByRole('article', { name: 'sales@acme.io' })).toBeInTheDocument();
      expect(spec.query).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
    });

    it('says nothing is connected yet and starts a connection on request', async () => {
      answer([]);
      renderWithProviders(spec.render(false));

      expect(screen.getByText('Not connected')).toBeInTheDocument();
      expect(screen.getByText(spec.empty)).toBeInTheDocument();
      await userEvent.click(connectButton());
      expect(spec.actions.connect).toHaveBeenCalledTimes(1);
    });

    it('logs a connection that fails to start', async () => {
      const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
      spec.actions.connect.mockRejectedValue(new Error('offline'));
      answer([]);
      renderWithProviders(spec.render(false));

      await userEvent.click(connectButton());
      await waitFor(() =>
        expect(warn).toHaveBeenCalledWith('crm: mailbox list action failed', new Error('offline')),
      );
    });

    it('turns Connect off with a plain reason, no setup jargon, when it cannot connect', async () => {
      vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
      answer([], false);
      renderWithProviders(spec.render(false));

      expect(connectButton()).toHaveAttribute('aria-disabled', 'true');
      await userEvent.click(connectButton());
      expect(spec.actions.connect).not.toHaveBeenCalled();
      await userEvent.hover(connectButton());
      expect(
        await screen.findByRole('tooltip', { name: 'Not available yet — ask your administrator' }),
      ).toBeInTheDocument();
      expect(screen.queryByText(/Tech|Environment Variables|OAuth/)).not.toBeInTheDocument();
    });

    it('shows a skeleton while the first load runs, with Connect off', () => {
      spec.query.mockReturnValue({ data: undefined, loading: true, refetch });
      renderWithProviders(spec.render(false));

      expect(screen.getByText(spec.loading)).toBeInTheDocument();
      expect(connectButton()).toBeDisabled();
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('reports a failed load with a retry, logging a retry that fails too', async () => {
      const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
      refetch.mockRejectedValue(new Error('still down'));
      spec.query.mockReturnValue({
        data: undefined,
        loading: false,
        error: new Error('Server unavailable'),
        refetch,
      });
      renderWithProviders(spec.render(false));

      expect(screen.getByText('Server unavailable')).toBeInTheDocument();
      await press('Retry');
      expect(refetch).toHaveBeenCalledTimes(1);
      await waitFor(() =>
        expect(warn).toHaveBeenCalledWith(
          'crm: mailbox list action failed',
          new Error('still down'),
        ),
      );
    });

    it('keeps showing the mailboxes when a background refresh fails', () => {
      spec.query.mockReturnValue({
        data: { [spec.listKey]: [spec.account], [spec.readyKey]: true },
        loading: false,
        error: new Error('Server unavailable'),
        refetch,
      });
      renderWithProviders(spec.render(true));

      expect(screen.getByRole('article', { name: 'sales@acme.io' })).toBeInTheDocument();
      expect(screen.queryByText('Server unavailable')).not.toBeInTheDocument();
    });
  });
}
