import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { ListWebhooksDocument } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { WebhooksPage } from '../../../../src/pages/webhooks/WebhooksPage';
import { webhook } from '../integrations/integrations.fixtures';

describe('WebhooksPage', () => {
  it('heads the page and lists the endpoints', async () => {
    renderWithProviders(<WebhooksPage />, {
      mocks: [
        {
          request: { query: ListWebhooksDocument },
          result: { data: { listWebhooks: [webhook()] } },
        },
      ],
    });
    expect(screen.getByRole('heading', { name: 'Webhooks' })).toBeInTheDocument();
    expect(screen.getByText(/see the event catalogue/)).toBeInTheDocument();
    expect(await screen.findByText('CRM bridge')).toBeInTheDocument();
  });
});
