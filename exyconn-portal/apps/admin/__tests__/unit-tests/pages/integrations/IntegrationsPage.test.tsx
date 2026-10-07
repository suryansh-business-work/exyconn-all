import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListApiKeysDocument, ListWebhooksDocument } from '@exyconn/shell/graphql/generated';
import { renderWithProviders, useCurrentUrl } from '../../test-utils';
import { IntegrationsPage } from '../../../../src/pages/integrations';
import { apiKey, webhook } from './integrations.fixtures';

const mocks = [
  {
    request: { query: ListApiKeysDocument },
    result: { data: { listApiKeys: [apiKey()] } },
  },
  {
    request: { query: ListWebhooksDocument },
    result: { data: { listWebhooks: [webhook()], webhookEvents: [] } },
  },
];

function Url() {
  return <output aria-label="url">{useCurrentUrl()}</output>;
}

describe('IntegrationsPage', () => {
  it('opens on the tab named in the URL and switches by slug', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <IntegrationsPage />
        <Url />
      </>,
      { mocks, route: '/admin/integrations/webhooks', path: '/admin/integrations/:tab?' },
    );
    expect(screen.getByRole('heading', { name: 'Integrations' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Webhooks' })).toHaveAttribute('aria-selected', 'true');
    expect(await screen.findByText('CRM bridge')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'API keys' }));
    expect(screen.getByLabelText('url')).toHaveTextContent('/admin/integrations/api-keys');
    expect(await screen.findByText('Payroll sync')).toBeInTheDocument();
  });
});
