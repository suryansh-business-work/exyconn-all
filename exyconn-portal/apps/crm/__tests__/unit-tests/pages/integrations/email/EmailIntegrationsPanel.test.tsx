import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { EmailIntegrationsPanel } from '../../../../../src/pages/integrations/email/EmailIntegrationsPanel';
import { renderWithProviders } from '../../../test-utils';

const gql = vi.hoisted(() => ({ status: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCrmIntegrationStatusQuery: (options: unknown) => gql.status(options),
}));

vi.mock('../../../../../src/pages/integrations/email/GmailCard', () => ({
  GmailCard: ({ ready }: Readonly<{ ready: boolean }>) => <p>Gmail card {String(ready)}</p>,
}));
vi.mock('../../../../../src/pages/integrations/email/MicrosoftMailCard', () => ({
  MicrosoftMailCard: ({ ready }: Readonly<{ ready: boolean }>) => (
    <p>Microsoft card {String(ready)}</p>
  ),
}));

describe('EmailIntegrationsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('tells each provider card whether its mailboxes are connected', () => {
    gql.status.mockReturnValue({
      data: { crmIntegrationStatus: { email: { gmail: true, microsoft: false } } },
    });
    renderWithProviders(<EmailIntegrationsPanel />);

    expect(screen.getByRole('heading', { name: 'Email' })).toBeInTheDocument();
    expect(screen.getByText('Gmail card true')).toBeInTheDocument();
    expect(screen.getByText('Microsoft card false')).toBeInTheDocument();
    expect(gql.status).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
  });

  it('lets every company connect its own mailboxes, both off until the status loads', () => {
    gql.status.mockReturnValue({ data: undefined });
    renderWithProviders(<EmailIntegrationsPanel />);

    expect(screen.queryByText(/operator/)).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByText('Gmail card false')).toBeInTheDocument();
    expect(screen.getByText('Microsoft card false')).toBeInTheDocument();
  });

  it('never mentions how the platform sets mail up', () => {
    gql.status.mockReturnValue({ data: undefined });
    renderWithProviders(<EmailIntegrationsPanel />);

    expect(screen.queryByText(/Tech|Environment Variables|OAuth/)).not.toBeInTheDocument();
  });
});
