import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { ContactOverview } from '../../../../../src/pages/contacts/detail/ContactOverview';
import { renderWithProviders } from '../../../test-utils';
import { contactRow } from '../../../fixtures';
import { fieldValue } from '../../record-detail-stubs';

vi.mock('../../../../../src/records/detail', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../../src/records/detail')>()),
  ...(await import('../../record-detail-stubs')).detailStubs,
}));

function renderOverview(contact: ReturnType<typeof contactRow>) {
  const { container } = renderWithProviders(<ContactOverview contact={contact} />);
  return (label: string) => fieldValue(container, label);
}

describe('ContactOverview', () => {
  it('puts the AI summary first and the five latest touchpoints last', () => {
    renderOverview(contactRow());

    expect(screen.getByText('AI summary of Asha Rao')).toBeInTheDocument();
    expect(screen.getByText('Timeline of CONTACT contact-1, last 5')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Profile overview' })).toBeInTheDocument();
  });

  it('shows a placeholder for every blank fact', () => {
    const value = renderOverview(contactRow({ companyId: '', owner: '', custom: null }));

    expect(value('About')).toBe('No description');
    expect(value('Source')).toBe('No source');
    expect(value('Associated company')).toBe('No company');
    expect(value('Department')).toBe('No department');
    expect(value('Website')).toBe('No website');
    expect(value('Contact owner')).toBe('No owner');
    expect(value('Lead owner')).toBe('Not recorded');
    expect(value('Notes')).toBe('No notes');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Custom values {}')).toBeInTheDocument();
  });

  it('links the company inside the CRM and the website out in a new tab', () => {
    const value = renderOverview(
      contactRow({
        description: 'Runs engineering',
        leadSource: 'Referral',
        department: 'Engineering',
        website: 'https://asha.dev',
        notes: 'Prefers email',
        custom: { tier: 'gold' },
      }),
    );

    expect(value('About')).toBe('Runs engineering');
    expect(value('Source')).toBe('Referral');
    expect(screen.getByRole('link', { name: 'Acme' })).toHaveAttribute(
      'href',
      '/companies/company-1',
    );
    expect(value('Department')).toBe('Engineering');
    const website = screen.getByRole('link', { name: 'https://asha.dev' });
    expect(website).toHaveAttribute('target', '_blank');
    expect(website).toHaveAttribute('rel', 'noopener noreferrer');
    expect(value('Contact owner')).toBe('Priya');
    expect(value('Notes')).toBe('Prefers email');
    expect(screen.getByText('Custom values {"tier":"gold"}')).toBeInTheDocument();
  });
});
