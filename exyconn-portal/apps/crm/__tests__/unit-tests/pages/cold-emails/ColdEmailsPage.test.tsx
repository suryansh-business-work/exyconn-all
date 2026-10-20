import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColdEmailsPage } from '../../../../src/pages/cold-emails/ColdEmailsPage';
import { renderWithProviders } from '../../test-utils';

vi.mock('../../../../src/pages/cold-emails/DraftsGrid', () => ({
  DraftsGrid: () => <p>Drafts grid</p>,
}));

describe('ColdEmailsPage', () => {
  it('lists the drafts under a header that can start a new one', async () => {
    renderWithProviders(<ColdEmailsPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Cold emails' })).toBeInTheDocument();
    expect(screen.getByText('Drafts grid')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Draft a cold email' }));
    expect(screen.getByRole('heading', { name: 'Draft a cold email' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Contact', pressed: true })).toBeInTheDocument();
  });
});
