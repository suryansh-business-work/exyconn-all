import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DnsAuthority, NameserverTarget } from '@exyconn/shell/graphql/generated';
import { NameserverPanel } from '../../../../../src/pages/security/cloudflare/NameserverPanel';
import type { DnsOverview } from '../../../../../src/pages/security/cloudflare/dns.types';
import { renderWithProviders } from '../../../test-utils';
import { overview } from './dns.fixtures';

const gql = vi.hoisted(() => ({
  set: vi.fn(),
  state: { loading: false },
  notify: vi.fn(),
  onChanged: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSetDomainNameserversMutation: () => [gql.set, gql.state],
}));
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useNotify: () => gql.notify,
}));
vi.mock('../../../../../src/pages/security/cloudflare/forms/nameservers', async () => ({
  NameserversForm: (await import('./dns.stubs')).NameserversFormStub,
}));

const renderPanel = (data: DnsOverview) =>
  renderWithProviders(<NameserverPanel overview={data} onChanged={gql.onChanged} />);

const button = (name: string) => screen.getByRole('button', { name });

async function confirmSwitch(title: string) {
  const dialog = await screen.findByRole('dialog', { name: title });
  await userEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
}

async function expectSwitched(target: NameserverTarget, nameServers?: string[]) {
  await waitFor(() =>
    expect(gql.set).toHaveBeenCalledWith({
      variables: { domain: 'example.com', target, nameServers },
    }),
  );
}

describe('NameserverPanel', () => {
  beforeEach(() => {
    gql.set.mockReset().mockResolvedValue({ data: { setDomainNameservers: ['ada.ns', 'bob.ns'] } });
    gql.state.loading = false;
    gql.notify.mockReset();
    gql.onChanged.mockReset().mockResolvedValue({});
  });

  it('shows who answers and both sets of nameservers', () => {
    renderPanel(overview());
    expect(screen.getByText('GoDaddy answers')).toBeInTheDocument();
    expect(screen.getByText('ns01.domaincontrol.com')).toBeInTheDocument();
    expect(screen.getByText('ada.ns.cloudflare.com')).toBeInTheDocument();
    expect(button('GoDaddy')).toHaveAttribute('aria-pressed', 'true');
    expect(button('GoDaddy')).toBeDisabled();
    expect(button('Cloudflare')).toHaveAttribute('aria-pressed', 'false');
    expect(button('Cloudflare')).toBeEnabled();
    expect(button('Cloudflare')).not.toHaveAttribute('aria-describedby');
  });

  it('switches to Cloudflare once confirmed, then reloads', async () => {
    renderPanel(overview());
    await userEvent.click(button('Cloudflare'));
    expect(screen.getByText(/Point example.com at Cloudflare’s nameservers/)).toBeInTheDocument();
    await confirmSwitch('Switch DNS to Cloudflare?');
    await waitFor(() => expect(gql.onChanged).toHaveBeenCalledTimes(1));
    await expectSwitched(NameserverTarget.Cloudflare);
    expect(gql.notify).toHaveBeenCalledWith('{domain} now points at {hosts}', 'success', {
      domain: 'example.com',
      hosts: 'ada.ns, bob.ns',
    });
  });

  it('changes nothing when the switch is cancelled', async () => {
    renderPanel(overview());
    await userEvent.click(button('Cloudflare'));
    const dialog = await screen.findByRole('dialog', { name: 'Switch DNS to Cloudflare?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(gql.set).not.toHaveBeenCalled();
  });

  it('refuses Cloudflare while there is no zone, and says why', () => {
    renderPanel(overview({ zone: null }));
    expect(button('Cloudflare')).toBeDisabled();
    expect(button('Cloudflare')).toHaveAttribute('aria-describedby', 'dns-ns-blocked');
    expect(
      screen.getByText('Shift the DNS to Cloudflare first — there is no zone yet.'),
    ).toHaveAttribute('id', 'dns-ns-blocked');
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('refuses Cloudflare while records are missing there', () => {
    renderPanel(overview({ missingOnCloudflare: 2 }));
    expect(button('Cloudflare')).toBeDisabled();
    expect(screen.getByText('Shift the missing records first.')).toBeInTheDocument();
  });

  it('switches back to GoDaddy from Cloudflare', async () => {
    renderPanel(overview({ authority: DnsAuthority.Cloudflare }));
    expect(screen.getByText('Cloudflare answers')).toBeInTheDocument();
    expect(button('Cloudflare')).toBeDisabled();
    await userEvent.click(button('GoDaddy'));
    expect(screen.getByText(/Point example.com back at GoDaddy’s nameservers/)).toBeInTheDocument();
    await confirmSwitch('Switch DNS back to GoDaddy?');
    await expectSwitched(NameserverTarget.Godaddy);
  });

  it('cannot switch back when no GoDaddy nameservers are on record', () => {
    renderPanel(overview({ authority: DnsAuthority.Cloudflare, previousGodaddyNameServers: [] }));
    expect(button('GoDaddy')).toBeDisabled();
    expect(
      screen.getByText('No GoDaddy nameservers on record — set them as custom nameservers.'),
    ).toBeInTheDocument();
  });

  it('offers both providers when the domain uses custom nameservers', () => {
    renderPanel(overview({ authority: DnsAuthority.Other, godaddyNameServers: [] }));
    expect(screen.getAllByText('Custom nameservers')).toHaveLength(2);
    expect(button('GoDaddy')).toHaveAttribute('aria-pressed', 'false');
    expect(button('GoDaddy')).toBeEnabled();
    expect(button('Cloudflare')).toBeEnabled();
    expect(screen.queryByText(/first/)).not.toBeInTheDocument();
  });

  it('reports a switch the registry refuses', async () => {
    gql.set.mockRejectedValueOnce(new Error('Registry locked')).mockRejectedValueOnce(42);
    renderPanel(overview());
    await userEvent.click(button('Cloudflare'));
    await confirmSwitch('Switch DNS to Cloudflare?');
    await waitFor(() => expect(gql.notify).toHaveBeenCalledWith('Registry locked', 'error'));
    await userEvent.click(button('Cloudflare'));
    await confirmSwitch('Switch DNS to Cloudflare?');
    await waitFor(() =>
      expect(gql.notify).toHaveBeenCalledWith('Changing the nameservers failed', 'error'),
    );
    expect(gql.onChanged).not.toHaveBeenCalled();
  });

  it('reports no hosts when the registry answers with none', async () => {
    gql.set.mockResolvedValue({ data: null });
    renderPanel(overview());
    await userEvent.click(button('Cloudflare'));
    await confirmSwitch('Switch DNS to Cloudflare?');
    await waitFor(() =>
      expect(gql.notify).toHaveBeenCalledWith('{domain} now points at {hosts}', 'success', {
        domain: 'example.com',
        hosts: '',
      }),
    );
  });

  it('points the domain at custom nameservers from the drawer', async () => {
    renderPanel(overview());
    await userEvent.click(button('Custom nameservers'));
    expect(
      await screen.findByText('Prefilled: ns01.domaincontrol.com ns02.domaincontrol.com'),
    ).toBeInTheDocument();
    await userEvent.click(button('Submit custom'));
    await expectSwitched(NameserverTarget.Custom, ['ns1.own.dev', 'ns2.own.dev']);
    await waitFor(() => expect(screen.queryByText(/Prefilled:/)).not.toBeInTheDocument());
  });

  it('closes the drawer on cancel without changing anything', async () => {
    renderPanel(overview());
    await userEvent.click(button('Custom nameservers'));
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel custom' }));
    await waitFor(() => expect(screen.queryByText(/Prefilled:/)).not.toBeInTheDocument());
    await userEvent.click(button('Custom nameservers'));
    await userEvent.click(await screen.findByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByText(/Prefilled:/)).not.toBeInTheDocument());
    expect(gql.set).not.toHaveBeenCalled();
  });

  it('locks every control while a change is in flight', () => {
    gql.state.loading = true;
    renderPanel(overview());
    expect(button('Cloudflare')).toBeDisabled();
    expect(button('Custom nameservers')).toBeDisabled();
  });
});
