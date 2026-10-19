import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { EmailIntegrationsPanel } from '../../../../../src/pages/integrations/email/EmailIntegrationsPanel';
import { renderWithProviders } from '../../../test-utils';

const gql = vi.hoisted(() => ({ status: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCrmIntegrationStatusQuery: (options: unknown) => gql.status(options),
}));

vi.mock('../../../../../src/pages/integrations/email/MicrosoftMailCard', () => ({
  MicrosoftMailCard: () => <p>Microsoft card</p>,
}));

function gmailCard() {
  return within(screen.getByRole('region', { name: 'Gmail' }));
}

describe('EmailIntegrationsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows Gmail connected when the status says so, next to Microsoft', () => {
    gql.status.mockReturnValue({
      data: { crmIntegrationStatus: { email: { gmail: true } } },
    });
    renderWithProviders(<EmailIntegrationsPanel />);

    expect(screen.getByRole('heading', { name: 'Email' })).toBeInTheDocument();
    expect(gmailCard().getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('Microsoft card')).toBeInTheDocument();
    expect(gql.status).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
  });

  it('says only the operator can connect, and Gmail is off until the status loads', () => {
    gql.status.mockReturnValue({ data: undefined });
    renderWithProviders(<EmailIntegrationsPanel />);

    expect(screen.getByText(/Email connections are available on the operator/)).toBeInTheDocument();
    expect(gmailCard().getByText('Not connected')).toBeInTheDocument();
  });
});
