import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { DnsStatusChip } from '../../../../../src/pages/cms/dns/DnsStatusChip';
import type { CmsDomainDnsRow } from '../../../../../src/pages/website/forms/cms-a-record';
import { renderWithProviders } from '../../../test-utils';
import { dnsRow, ipAddress } from './dns.fixtures';

const renderChip = (row: CmsDomainDnsRow) => renderWithProviders(<DnsStatusChip row={row} />);

describe('DnsStatusChip', () => {
  it('shows why the DNS could not be read', () => {
    renderChip(dnsRow({ error: 'The zone is not on GoDaddy' }));
    expect(screen.getByText('The zone is not on GoDaddy')).toBeInTheDocument();
  });

  it('says when the domain has no A record', () => {
    renderChip(dnsRow({ records: [] }));
    expect(screen.getByText('No A record')).toBeInTheDocument();
  });

  it('says when the domain points at the websites server', () => {
    renderChip(dnsRow({ pointsHere: true }));
    expect(screen.getByText('Points to Exyconn')).toBeInTheDocument();
  });

  it('warns when the domain points elsewhere', () => {
    renderChip(dnsRow({ pointsHere: false, records: [{ ip: ipAddress(9), ttl: 600 }] }));
    expect(screen.getByText('Points elsewhere')).toBeInTheDocument();
  });
});
