import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CLOUDFLARE_PATH, CloudflarePage } from '../../../../../src/pages/security/cloudflare';
import { renderWithProviders, useCurrentUrl } from '../../../test-utils';

const gql = vi.hoisted(() => ({ domains: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useDnsDomainsQuery: gql.domains,
}));
vi.mock('../../../../../src/pages/security/cloudflare/DomainDnsView', async () => ({
  DomainDnsView: (await import('./dns.stubs')).DomainDnsViewStub,
}));

const DOMAINS = [
  { domain: 'example.com', status: 'ACTIVE' },
  { domain: 'example.org', status: 'ACTIVE' },
];

function Url() {
  return <output aria-label="url">{useCurrentUrl()}</output>;
}

const renderPage = (search = '') =>
  renderWithProviders(
    <>
      <CloudflarePage />
      <Url />
    </>,
    { route: `${CLOUDFLARE_PATH}${search}` },
  );

const domainSelect = () => screen.getByRole('combobox', { name: /Domain/ });

describe('CloudflarePage', () => {
  beforeEach(() => {
    gql.domains.mockReset();
  });

  it('lives under Tech › Security', () => {
    expect(CLOUDFLARE_PATH).toBe('/tech/security/cloudflare');
  });

  it('waits for the GoDaddy domains before offering one', () => {
    gql.domains.mockReturnValue({ data: undefined, loading: true });
    renderPage();
    expect(domainSelect()).toHaveAttribute('aria-disabled', 'true');
    expect(screen.queryByText(/DNS view for/)).not.toBeInTheDocument();
    expect(screen.queryByText('No domains on the GoDaddy account.')).not.toBeInTheDocument();
  });

  it('opens the first domain when the link names none', () => {
    gql.domains.mockReturnValue({ data: { dnsDomains: DOMAINS }, loading: false });
    renderPage();
    expect(domainSelect()).toHaveTextContent('example.com');
    expect(screen.getByText('DNS view for example.com')).toBeInTheDocument();
  });

  it('opens the domain the link names', () => {
    gql.domains.mockReturnValue({ data: { dnsDomains: DOMAINS }, loading: false });
    renderPage('?domain=example.org');
    expect(domainSelect()).toHaveTextContent('example.org');
    expect(screen.getByText('DNS view for example.org')).toBeInTheDocument();
  });

  it('still opens a linked domain the account does not list, with nothing selected', () => {
    gql.domains.mockReturnValue({ data: { dnsDomains: DOMAINS }, loading: false });
    renderPage('?domain=elsewhere.net');
    expect(domainSelect()).not.toHaveTextContent('example');
    expect(screen.getByText('DNS view for elsewhere.net')).toBeInTheDocument();
  });

  it('keeps the chosen domain in the URL', async () => {
    gql.domains.mockReturnValue({ data: { dnsDomains: DOMAINS }, loading: false });
    renderPage();
    await userEvent.click(domainSelect());
    await userEvent.click(
      within(screen.getByRole('listbox')).getByRole('option', { name: 'example.org' }),
    );
    expect(screen.getByLabelText('url')).toHaveTextContent(`${CLOUDFLARE_PATH}?domain=example.org`);
    expect(await screen.findByText('DNS view for example.org')).toBeInTheDocument();
  });

  it('says so when the GoDaddy account holds no domain', () => {
    gql.domains.mockReturnValue({ data: { dnsDomains: [] }, loading: false });
    renderPage();
    expect(screen.getByText('No domains on the GoDaddy account.')).toBeInTheDocument();
    expect(domainSelect()).toHaveAttribute('aria-disabled', 'true');
    expect(screen.queryByText(/DNS view for/)).not.toBeInTheDocument();
  });

  it('shows why the domains could not be read', () => {
    gql.domains.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('GoDaddy 401'),
    });
    renderPage();
    expect(screen.getByRole('alert')).toHaveTextContent('GoDaddy 401');
    expect(screen.queryByText('No domains on the GoDaddy account.')).not.toBeInTheDocument();
  });
});
