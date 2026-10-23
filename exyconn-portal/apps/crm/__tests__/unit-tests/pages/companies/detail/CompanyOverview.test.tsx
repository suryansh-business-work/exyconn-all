import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { CrmOriginSource } from '@exyconn/shell/graphql/generated';
import { CompanyOverview } from '../../../../../src/pages/companies/detail/CompanyOverview';
import { renderWithProviders } from '../../../test-utils';
import { companyRow } from '../../../fixtures';
import { fieldValue } from '../../record-detail-stubs';

vi.mock('../../../../../src/records/detail', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../../src/records/detail')>()),
  ...(await import('../../record-detail-stubs')).detailStubs,
}));

function renderOverview(company: ReturnType<typeof companyRow>) {
  const { container } = renderWithProviders(<CompanyOverview company={company} />);
  return (label: string) => fieldValue(container, label);
}

describe('CompanyOverview', () => {
  it('puts the AI summary first and the five latest touchpoints last', () => {
    renderOverview(companyRow());

    expect(screen.getByText('AI summary of Acme')).toBeInTheDocument();
    expect(screen.getByText('Timeline of COMPANY company-1, last 5')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Company overview' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Recent activity' })).toBeInTheDocument();
  });

  it('shows a placeholder for every blank fact and no links', () => {
    const value = renderOverview(companyRow({ owner: '', custom: null }));

    expect(value('About')).toBe('No description');
    expect(value('Website')).toBe('No website');
    expect(value('LinkedIn')).toBe('No LinkedIn page');
    expect(value('X (Twitter)')).toBe('No X account');
    expect(value('Address')).toBe('No address');
    expect(value('Company owner')).toBe('No owner');
    expect(value('Lead owner')).toBe('Not recorded');
    expect(value('Notes')).toBe('No notes');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Custom values {}')).toBeInTheDocument();
  });

  it('links the web profiles out in a new tab and shows what is known', () => {
    const value = renderOverview(
      companyRow({
        description: 'Makes rockets',
        website: 'https://acme.io',
        linkedinUrl: 'https://linkedin.com/company/acme',
        twitterUrl: 'https://x.com/acme',
        address: '1 Main St',
        notes: 'Met at expo',
        custom: { tier: 'gold' },
        origin: {
          __typename: 'CrmRecordOrigin',
          source: CrmOriginSource.User,
          userName: 'Priya',
          userEmail: 'priya@exyconn.com',
        },
      }),
    );

    expect(value('About')).toBe('Makes rockets');
    for (const url of [
      'https://acme.io',
      'https://linkedin.com/company/acme',
      'https://x.com/acme',
    ]) {
      const link = screen.getByRole('link', { name: url });
      expect(link).toHaveAttribute('href', url);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
    expect(value('Address')).toBe('1 Main St');
    expect(value('Company owner')).toBe('Priya');
    expect(value('Lead owner')).toContain('Priya (priya@exyconn.com)');
    expect(screen.getByRole('button', { name: 'Email priya@exyconn.com' })).toBeInTheDocument();
    expect(value('Notes')).toBe('Met at expo');
    expect(value('Added')).not.toBe('');
    expect(screen.getByText('Custom values {"tier":"gold"}')).toBeInTheDocument();
  });
});
