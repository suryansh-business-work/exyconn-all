import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EMAIL_PATH, EmailPage } from '../../../../src/pages/email';
import { renderWithProviders, useCurrentUrl } from '../../test-utils';

vi.mock('../../../../src/pages/email/EmailDashboardPanel', async () =>
  (await import('../environment-variables/panel.harness')).panelModule('EmailDashboardPanel'),
);
vi.mock('../../../../src/pages/email/EmailTemplatesPanel', async () =>
  (await import('../environment-variables/panel.harness')).panelModule('EmailTemplatesPanel'),
);
vi.mock('../../../../src/pages/email/EmailFragmentsPanel', async () =>
  (await import('../environment-variables/panel.harness')).panelModule('EmailFragmentsPanel'),
);
vi.mock('../../../../src/pages/email/EmailLogsPanel', async () =>
  (await import('../environment-variables/panel.harness')).panelModule('EmailLogsPanel'),
);
vi.mock('../../../../src/pages/environment-variables/EmailConfigsPanel', async () =>
  (await import('../environment-variables/panel.harness')).panelModule('EmailConfigsPanel'),
);

function Url() {
  return <output aria-label="url">{useCurrentUrl()}</output>;
}

const renderAt = (route: string) =>
  renderWithProviders(
    <>
      <EmailPage />
      <Url />
    </>,
    { route },
  );

describe('EmailPage', () => {
  it('lives under /tech/email', () => {
    expect(EMAIL_PATH).toBe('/tech/email');
  });

  it('opens on the dashboard, the one tab that says whether email works', async () => {
    renderAt('/tech/email');
    expect(await screen.findByTestId('EmailDashboardPanel')).toBeInTheDocument();
    expect(screen.getByLabelText('url')).toHaveTextContent('/tech/email/dashboard');
    expect(screen.getByRole('tablist', { name: 'Email system' })).toBeInTheDocument();
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Dashboard',
      'Templates',
      'Fragments',
      'Logs',
      'Settings',
    ]);
  });

  it.each([
    ['templates', 'EmailTemplatesPanel'],
    ['fragments', 'EmailFragmentsPanel'],
    ['logs', 'EmailLogsPanel'],
    ['settings', 'EmailConfigsPanel'],
  ])('shows the %s tab at its own address', (slug, panel) => {
    renderAt(`/tech/email/${slug}`);
    expect(screen.getByRole('tabpanel')).toContainElement(screen.getByTestId(panel));
    expect(screen.queryByTestId('EmailDashboardPanel')).not.toBeInTheDocument();
  });

  it('switches tabs from the strip, keeping the tab in the address', async () => {
    renderAt('/tech/email/dashboard');
    await userEvent.click(screen.getByRole('tab', { name: 'Logs' }));
    expect(await screen.findByTestId('EmailLogsPanel')).toBeInTheDocument();
    expect(screen.getByLabelText('url')).toHaveTextContent('/tech/email/logs');
  });
});
