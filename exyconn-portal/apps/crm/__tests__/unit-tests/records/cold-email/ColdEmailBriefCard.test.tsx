import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { ColdEmailBriefCard } from '../../../../src/records/cold-email/ColdEmailBriefCard';
import { renderWithProviders } from '../../test-utils';

describe('ColdEmailBriefCard', () => {
  it('shows what their business does and what of ours fits them', () => {
    renderWithProviders(
      <ColdEmailBriefCard
        draft={{
          recordName: 'Acme',
          brief: {
            about: 'Acme runs grocery stores in Pune.',
            fit: ['Checkout audit: long queues', 'Delivery tracking'],
          },
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'About Acme' })).toBeInTheDocument();
    expect(screen.getByText('Acme runs grocery stores in Pune.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'What we can offer them' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Checkout audit: long queues',
      'Delivery tracking',
    ]);
  });

  it('shows only the half the AI filled in', () => {
    renderWithProviders(
      <ColdEmailBriefCard draft={{ recordName: 'Acme', brief: { about: '', fit: ['Audit'] } }} />,
    );

    expect(screen.queryByRole('heading', { name: 'About Acme' })).toBeNull();
    expect(screen.getByText('Audit')).toBeInTheDocument();
  });

  it('shows nothing for a draft written before briefs', () => {
    const { container } = renderWithProviders(
      <ColdEmailBriefCard draft={{ recordName: 'Acme', brief: { about: '', fit: [] } }} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
