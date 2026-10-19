import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { GmailCard } from '../../../../../src/pages/integrations/email/GmailCard';
import { renderWithProviders } from '../../../test-utils';

describe('GmailCard', () => {
  it('shows a ready mailbox as connected', () => {
    renderWithProviders(<GmailCard ready />);

    expect(screen.getByRole('heading', { name: 'Gmail' })).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('shows no mailbox as not connected', () => {
    renderWithProviders(<GmailCard ready={false} />);

    expect(screen.getByText('Not connected')).toBeInTheDocument();
  });

  it('leads to the Gmail settings page to manage the mailboxes', () => {
    renderWithProviders(<GmailCard ready={false} />);

    expect(screen.getByRole('link', { name: 'Manage Gmail accounts' })).toHaveAttribute(
      'href',
      '/settings/gmail',
    );
  });
});
