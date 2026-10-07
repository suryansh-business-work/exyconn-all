import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DnsRecordStatus } from '@exyconn/shell/graphql/generated';
import { RecordsCompare } from '../../../../../src/pages/security/cloudflare/RecordsCompare';
import { renderWithProviders } from '../../../test-utils';
import { record } from './dns.fixtures';

const RECORDS = [
  record('a-root', DnsRecordStatus.Match),
  record('mx-root', DnsRecordStatus.MissingOnCloudflare, {
    type: 'MX',
    content: 'mail.example.com',
    priority: 10,
    godaddyTtl: 3600,
    cloudflareTtl: null,
    cloudflareProxied: null,
  }),
  record('cname-www', DnsRecordStatus.OnlyOnCloudflare, {
    type: 'CNAME',
    name: 'www',
    content: 'example.com',
    godaddyTtl: null,
    cloudflareTtl: 300,
    cloudflareProxied: false,
  }),
  record('txt-root', DnsRecordStatus.Match, {
    type: 'TXT',
    content: 'v=spf1 -all',
    priority: undefined,
    godaddyTtl: undefined,
    cloudflareTtl: undefined,
  }),
];

const side = (name: string) => screen.getByRole('region', { name });
const row = (region: HTMLElement, text: string) =>
  within(region).getByText(text).closest('tr') as HTMLElement;

describe('RecordsCompare', () => {
  it('shows each provider’s records with where each one exists', () => {
    renderWithProviders(
      <RecordsCompare records={RECORDS} hasZone loading={false} onRefresh={vi.fn()} />,
    );
    const godaddy = side('GoDaddy · 3');
    const cloudflare = side('Cloudflare · 3');

    expect(within(godaddy).queryByText('www')).not.toBeInTheDocument();
    expect(
      within(godaddy).queryByRole('columnheader', { name: 'Proxied' }),
    ).not.toBeInTheDocument();
    const mx = row(godaddy, '10 mail.example.com');
    expect(within(mx).getByText('3600')).toBeInTheDocument();
    expect(within(mx).getByText('MISSING ON CLOUDFLARE')).toBeInTheDocument();
    expect(within(row(godaddy, '203.0.113.10')).getByText('600')).toBeInTheDocument();
    expect(within(row(godaddy, 'v=spf1 -all')).getByText('—')).toBeInTheDocument();

    expect(within(cloudflare).queryByText('10 mail.example.com')).not.toBeInTheDocument();
    expect(within(cloudflare).getByRole('columnheader', { name: 'Proxied' })).toBeInTheDocument();
    const root = row(cloudflare, '203.0.113.10');
    expect(within(root).getByText('Auto')).toBeInTheDocument();
    expect(within(root).getByText('Yes')).toBeInTheDocument();
    const www = row(cloudflare, 'www');
    expect(within(www).getByText('300')).toBeInTheDocument();
    expect(within(www).getByText('No')).toBeInTheDocument();
    expect(within(www).getByText('ONLY ON CLOUDFLARE')).toBeInTheDocument();
  });

  it('explains an empty Cloudflare side by whether the zone exists', () => {
    const { rerender } = renderWithProviders(
      <RecordsCompare records={[]} hasZone loading={false} onRefresh={vi.fn()} />,
    );
    expect(screen.getByText('No records on GoDaddy.')).toBeInTheDocument();
    expect(screen.getByText('No records on Cloudflare yet.')).toBeInTheDocument();
    rerender(<RecordsCompare records={[]} hasZone={false} loading={false} onRefresh={vi.fn()} />);
    expect(
      screen.getByText('This domain has no Cloudflare zone yet — shift the DNS to create it.'),
    ).toBeInTheDocument();
  });

  it('reloads from either table and locks the reload while loading', async () => {
    const onRefresh = vi.fn().mockResolvedValue({});
    const { rerender } = renderWithProviders(
      <RecordsCompare records={RECORDS} hasZone loading={false} onRefresh={onRefresh} />,
    );
    const [first, second] = screen.getAllByRole('button', { name: 'Refresh table' });
    await userEvent.click(first);
    await userEvent.click(second);
    expect(onRefresh).toHaveBeenCalledTimes(2);
    rerender(<RecordsCompare records={RECORDS} hasZone loading onRefresh={onRefresh} />);
    for (const button of screen.getAllByRole('button', { name: 'Refresh table' })) {
      expect(button).toBeDisabled();
    }
  });
});
