import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShiftPanel } from '../../../../../src/pages/security/cloudflare/ShiftPanel';
import type { DnsOverview } from '../../../../../src/pages/security/cloudflare/dns.types';
import { renderWithProviders } from '../../../test-utils';
import { overview } from './dns.fixtures';

const gql = vi.hoisted(() => ({
  migrate: vi.fn(),
  state: { loading: false },
  notify: vi.fn(),
  onChanged: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useMigrateDnsToCloudflareMutation: () => [gql.migrate, gql.state],
}));
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useNotify: () => gql.notify,
}));

const SHIFT = 'Shift DNS to Cloudflare';

const renderPanel = (data: DnsOverview) =>
  renderWithProviders(<ShiftPanel overview={data} onChanged={gql.onChanged} />);

async function shift(answer: 'Confirm' | 'Cancel' = 'Confirm') {
  await userEvent.click(screen.getByRole('button', { name: SHIFT }));
  const dialog = await screen.findByRole('dialog', { name: 'Shift DNS to Cloudflare?' });
  const message = dialog.textContent;
  await userEvent.click(within(dialog).getByRole('button', { name: answer }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  return message;
}

const result = (created: number, failed: Array<Record<string, string>> = []) => ({
  data: { migrateDnsToCloudflare: { created, alreadyPresent: 0, failed } },
});

describe('ShiftPanel', () => {
  beforeEach(() => {
    gql.migrate.mockReset().mockResolvedValue(result(3));
    gql.state.loading = false;
    gql.notify.mockReset();
    gql.onChanged.mockReset().mockResolvedValue({});
  });

  it('says every record is already on Cloudflare and has nothing to shift', () => {
    renderPanel(overview());
    expect(screen.getByText('Every GoDaddy record is on Cloudflare.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: SHIFT })).toBeDisabled();
  });

  it('copies the missing records into the existing zone once confirmed', async () => {
    renderPanel(overview({ missingOnCloudflare: 3 }));
    expect(screen.getByText('3 GoDaddy record(s) are not on Cloudflare yet.')).toBeInTheDocument();
    const message = await shift();
    expect(message).toContain(
      'Copy 3 record(s) from GoDaddy into the Cloudflare zone for example.com.',
    );
    await waitFor(() => expect(gql.onChanged).toHaveBeenCalledTimes(1));
    expect(gql.migrate).toHaveBeenCalledWith({ variables: { domain: 'example.com' } });
    expect(gql.notify).toHaveBeenCalledWith(
      'Copied {created} record(s) to Cloudflare; {failed} failed',
      'success',
      { created: 3, failed: 0 },
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('creates the zone first when the domain has none', async () => {
    renderPanel(overview({ zone: null, missingOnCloudflare: 0 }));
    expect(screen.getByRole('button', { name: SHIFT })).toBeEnabled();
    const message = await shift();
    expect(message).toContain('Create a Cloudflare zone for example.com and copy 0 record(s)');
    await waitFor(() => expect(gql.migrate).toHaveBeenCalledTimes(1));
  });

  it('does nothing when the shift is cancelled', async () => {
    renderPanel(overview({ missingOnCloudflare: 1 }));
    await shift('Cancel');
    expect(gql.migrate).not.toHaveBeenCalled();
    expect(gql.notify).not.toHaveBeenCalled();
  });

  it('warns about and lists the records Cloudflare refused', async () => {
    gql.migrate.mockResolvedValue(
      result(2, [{ type: 'TXT', name: '_dmarc', content: 'v=DMARC1', message: 'Invalid content' }]),
    );
    renderPanel(overview({ missingOnCloudflare: 3 }));
    await shift();
    expect(await screen.findByRole('alert')).toHaveTextContent('TXT _dmarc: Invalid content');
    expect(gql.notify).toHaveBeenCalledWith(
      'Copied {created} record(s) to Cloudflare; {failed} failed',
      'warning',
      { created: 2, failed: 1 },
    );
  });

  it('counts nothing when the server answers without a result', async () => {
    gql.migrate.mockResolvedValue({ data: null });
    renderPanel(overview({ missingOnCloudflare: 1 }));
    await shift();
    await waitFor(() =>
      expect(gql.notify).toHaveBeenCalledWith(
        'Copied {created} record(s) to Cloudflare; {failed} failed',
        'success',
        { created: 0, failed: 0 },
      ),
    );
  });

  it('reports a shift that fails', async () => {
    gql.migrate
      .mockRejectedValueOnce(new Error('Zone limit reached'))
      .mockRejectedValueOnce('boom');
    renderPanel(overview({ missingOnCloudflare: 1 }));
    await shift();
    await waitFor(() => expect(gql.notify).toHaveBeenCalledWith('Zone limit reached', 'error'));
    await shift();
    await waitFor(() =>
      expect(gql.notify).toHaveBeenCalledWith('Shifting the DNS failed', 'error'),
    );
    expect(gql.onChanged).not.toHaveBeenCalled();
  });

  it('shows the shift running', () => {
    gql.state.loading = true;
    renderPanel(overview({ missingOnCloudflare: 1 }));
    expect(screen.getByRole('button', { name: 'Shifting…' })).toBeDisabled();
  });
});
