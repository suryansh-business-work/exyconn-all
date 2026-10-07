import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DomainsDnsPanel } from '../../../../../src/pages/cms/dns';
import { renderWithProviders } from '../../../test-utils';
import { queryResult } from '../cms-helpers';
import { dnsRow, ipAddress } from './dns.fixtures';

const gql = vi.hoisted(() => ({ dns: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCmsSiteDnsQuery: (options: unknown) => gql.dns(options),
}));

vi.mock('../../../../../src/pages/website/forms/cms-a-record', () => ({
  ARecordForm: (
    props: Readonly<{
      siteId: string;
      domain: { domain: string } | null;
      serverIp: string;
      onClose: () => void;
      onDone: () => void;
    }>,
  ) =>
    props.domain && (
      <div>
        <p>{`A record of ${props.domain.domain} on ${props.siteId} to ${props.serverIp}`}</p>
        <button type="button" onClick={props.onClose}>
          Close form
        </button>
        <button type="button" onClick={props.onDone}>
          Finish form
        </button>
      </div>
    ),
}));

const SERVER_IP = ipAddress(10);
const domains = [
  dnsRow(),
  dnsRow({ domain: 'blog.exyconn.com', authority: 'CLOUDFLARE', records: [] }),
  dnsRow({ domain: 'shop.exyconn.com', authority: 'ROUTE53', records: [], error: 'Not reachable' }),
];

const answer = (
  data: { serverIp: string; domains: unknown[] } | undefined,
  extra: { loading?: boolean; error?: Error } = {},
) =>
  gql.dns.mockReturnValue(
    queryResult(data && { cmsSiteDns: data }, { ...extra, refetch: gql.refetch }),
  );

const chipOf = (text: string) => screen.getByText(text).closest('.MuiChip-root');

describe('DomainsDnsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    answer({ serverIp: SERVER_IP, domains });
  });

  it("lists each domain's DNS provider, A records and where it points", () => {
    renderWithProviders(<DomainsDnsPanel siteId="site-1" />);

    expect(gql.dns).toHaveBeenCalledWith({
      variables: { siteId: 'site-1' },
      fetchPolicy: 'network-only',
    });
    expect(screen.getByRole('heading', { name: 'Domains & DNS' })).toBeInTheDocument();
    expect(
      screen.getByText(
        `The websites are served from ${SERVER_IP}. Domains are added in the settings above.`,
      ),
    ).toBeInTheDocument();
    const first = screen.getByText('exyconn.com').closest('tr') as HTMLElement;
    expect(within(first).getByText(`${SERVER_IP} (TTL 600)`)).toBeInTheDocument();
    expect(within(first).getByText('Points to Exyconn')).toBeInTheDocument();
    expect(chipOf('GODADDY')).toHaveClass('MuiChip-colorPrimary');
    expect(chipOf('CLOUDFLARE')).toHaveClass('MuiChip-colorWarning');
    expect(chipOf('ROUTE53')).toHaveClass('MuiChip-colorDefault');
    expect(screen.getAllByText('—')).toHaveLength(2);
    expect(screen.getByText('Not reachable')).toBeInTheDocument();
  });

  it('explains where DNS is read from before the server address is known', () => {
    answer({ serverIp: '', domains: [] });
    renderWithProviders(<DomainsDnsPanel siteId="site-1" />);

    expect(
      screen.getByText(
        'Domains are added in the settings above; their DNS is read from GoDaddy or Cloudflare.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('This site has no domains yet.')).toBeInTheDocument();
  });

  it('says why the DNS could not be read', () => {
    answer(undefined, { error: new Error('GoDaddy refused the key') });
    renderWithProviders(<DomainsDnsPanel siteId="site-1" />);

    expect(screen.getByText('Could not read the DNS: GoDaddy refused the key')).toBeInTheDocument();
  });

  it('shows placeholder rows until the first answer', () => {
    answer(undefined, { loading: true });
    const { container } = renderWithProviders(<DomainsDnsPanel siteId="site-1" />);

    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
  });

  it('opens the A record form for a domain and closes it again', async () => {
    renderWithProviders(<DomainsDnsPanel siteId="site-1" />);
    const row = screen.getByText('blog.exyconn.com').closest('tr') as HTMLElement;

    await userEvent.click(within(row).getByRole('button', { name: 'Add or update the A record' }));
    expect(
      screen.getByText(`A record of blog.exyconn.com on site-1 to ${SERVER_IP}`),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Close form' }));
    expect(screen.queryByText(/A record of/)).not.toBeInTheDocument();
    expect(gql.refetch).not.toHaveBeenCalled();
  });

  it('reloads the DNS after a record is set', async () => {
    renderWithProviders(<DomainsDnsPanel siteId="site-1" />);
    const row = screen.getByText('exyconn.com').closest('tr') as HTMLElement;

    await userEvent.click(within(row).getByRole('button', { name: 'Add or update the A record' }));
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));

    expect(screen.queryByText(/A record of/)).not.toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('reports a reload that failed after a record is set', async () => {
    gql.refetch.mockRejectedValueOnce('offline');
    renderWithProviders(<DomainsDnsPanel siteId="site-1" />);
    const row = screen.getByText('exyconn.com').closest('tr') as HTMLElement;

    await userEvent.click(within(row).getByRole('button', { name: 'Add or update the A record' }));
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));

    expect(await screen.findByText('Could not reload the DNS')).toBeInTheDocument();
  });
});
