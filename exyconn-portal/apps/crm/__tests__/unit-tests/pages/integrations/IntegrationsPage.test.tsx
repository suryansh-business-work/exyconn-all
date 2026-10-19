import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntegrationsPage } from '../../../../src/pages/integrations';
import { renderWithProviders } from '../../test-utils';
import { UrlProbe } from '../../form-stub';

vi.mock('../../../../src/pages/integrations/call/CallConfigsPanel', () => ({
  CallConfigsPanel: () => <p>Call panel</p>,
}));
vi.mock('../../../../src/pages/integrations/sms/SmsConfigsPanel', () => ({
  SmsConfigsPanel: () => <p>SMS panel</p>,
}));
vi.mock('../../../../src/pages/integrations/email/EmailIntegrationsPanel', () => ({
  EmailIntegrationsPanel: () => <p>Email panel</p>,
}));

function renderPage(route: string) {
  renderWithProviders(
    <>
      <IntegrationsPage />
      <UrlProbe />
    </>,
    { route, path: '/integrations/*' },
  );
}

describe('IntegrationsPage', () => {
  it('offers the Call, SMS and Email tabs and opens Call first', () => {
    renderPage('/integrations');

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Call',
      'SMS',
      'Email',
    ]);
    expect(screen.getByText('Call panel')).toBeInTheDocument();
  });

  it('opens the tab named in the address', () => {
    renderPage('/integrations/email');

    expect(screen.getByText('Email panel')).toBeInTheDocument();
    expect(screen.queryByText('Call panel')).not.toBeInTheDocument();
  });

  it('puts the chosen tab in the address', async () => {
    renderPage('/integrations/call');

    await userEvent.click(screen.getByRole('tab', { name: 'SMS' }));

    expect(screen.getByText('SMS panel')).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'current url' })).toHaveTextContent(
      '/integrations/sms',
    );
  });
});
