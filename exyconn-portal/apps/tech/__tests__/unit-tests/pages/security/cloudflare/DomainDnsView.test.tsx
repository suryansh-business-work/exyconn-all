import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { DnsRecordStatus } from '@exyconn/shell/graphql/generated';
import { DomainDnsView } from '../../../../../src/pages/security/cloudflare/DomainDnsView';
import { renderWithProviders } from '../../../test-utils';
import { overview, record } from './dns.fixtures';
import { panels } from './dns.stubs';

const gql = vi.hoisted(() => ({ overview: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useDnsOverviewQuery: gql.overview,
}));
vi.mock('../../../../../src/pages/security/cloudflare/NameserverPanel', async () => ({
  NameserverPanel: (await import('./dns.stubs')).NameserverPanelStub,
}));
vi.mock('../../../../../src/pages/security/cloudflare/ShiftPanel', async () => ({
  ShiftPanel: (await import('./dns.stubs')).ShiftPanelStub,
}));
vi.mock('../../../../../src/pages/security/cloudflare/RecordsCompare', async () => ({
  RecordsCompare: (await import('./dns.stubs')).RecordsCompareStub,
}));

const answer = (result: Record<string, unknown>) =>
  gql.overview.mockReturnValue({
    data: undefined,
    loading: false,
    refetch: gql.refetch,
    ...result,
  });

describe('DomainDnsView', () => {
  beforeEach(() => {
    gql.overview.mockReset();
    gql.refetch.mockReset().mockResolvedValue({});
    panels.nameservers.mockReset();
    panels.shift.mockReset();
    panels.records.mockReset();
  });

  it('reads the domain’s overview fresh, reporting refetches', () => {
    answer({ loading: true });
    const { container } = renderWithProviders(<DomainDnsView domain="example.com" />);
    expect(gql.overview).toHaveBeenCalledWith({
      variables: { domain: 'example.com' },
      fetchPolicy: 'cache-and-network',
      notifyOnNetworkStatusChange: true,
    });
    expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
    expect(panels.nameservers).not.toHaveBeenCalled();
  });

  it('shows the error when there is no overview to fall back on', () => {
    answer({ error: new Error('Cloudflare token rejected') });
    renderWithProviders(<DomainDnsView domain="example.com" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Cloudflare token rejected');
  });

  it('keeps showing the last overview when a refetch fails', () => {
    answer({ data: { dnsOverview: overview() }, error: new Error('Network down') });
    renderWithProviders(<DomainDnsView domain="example.com" />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('Nameservers of example.com')).toBeInTheDocument();
  });

  it('hands the overview to the nameserver, shift and records panels', async () => {
    const data = overview({
      records: [record('a', DnsRecordStatus.Match), record('b', DnsRecordStatus.OnlyOnCloudflare)],
    });
    answer({ data: { dnsOverview: data }, loading: true });
    renderWithProviders(<DomainDnsView domain="example.com" />);
    expect(screen.getByText('Shift for example.com')).toBeInTheDocument();
    expect(screen.getByText('2 records compared')).toBeInTheDocument();

    const nameservers = panels.nameservers.mock.lastCall?.[0];
    expect(nameservers?.overview).toBe(data);
    expect(nameservers?.onChanged).toBe(gql.refetch);
    expect(panels.shift.mock.lastCall?.[0].onChanged).toBe(gql.refetch);

    const records = panels.records.mock.lastCall?.[0];
    expect(records).toMatchObject({ records: data.records, hasZone: true, loading: true });
    await records?.onRefresh();
    expect(gql.refetch).toHaveBeenCalledWith();
  });

  it('tells the records panel when the domain has no Cloudflare zone', () => {
    answer({ data: { dnsOverview: overview({ zone: null }) } });
    renderWithProviders(<DomainDnsView domain="example.com" />);
    expect(panels.records.mock.lastCall?.[0]).toMatchObject({ hasZone: false, loading: false });
  });
});
