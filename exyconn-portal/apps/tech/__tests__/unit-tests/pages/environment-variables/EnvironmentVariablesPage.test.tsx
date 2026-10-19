import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ENVIRONMENT_VARIABLES_PATH,
  EnvironmentVariablesPage,
} from '../../../../src/pages/environment-variables';
import { renderWithProviders, useCurrentUrl } from '../../test-utils';

vi.mock('../../../../src/pages/environment-variables/SlackConfigsPanel', async () =>
  (await import('./panel.harness')).panelModule('SlackConfigsPanel'),
);
vi.mock('../../../../src/pages/environment-variables/ImageConfigsPanel', async () =>
  (await import('./panel.harness')).panelModule('ImageConfigsPanel'),
);
vi.mock('../../../../src/pages/environment-variables/PexelsConfigsPanel', async () =>
  (await import('./panel.harness')).panelModule('PexelsConfigsPanel'),
);
vi.mock('../../../../src/pages/environment-variables/OpenAiConfigsPanel', async () =>
  (await import('./panel.harness')).panelModule('OpenAiConfigsPanel'),
);
vi.mock('../../../../src/pages/environment-variables/EmailConfigsPanel', async () =>
  (await import('./panel.harness')).panelModule('EmailConfigsPanel'),
);
vi.mock('../../../../src/pages/environment-variables/InboundMailConfigsPanel', async () =>
  (await import('./panel.harness')).panelModule('InboundMailConfigsPanel'),
);
vi.mock('../../../../src/pages/environment-variables/GithubConfigsPanel', async () =>
  (await import('./panel.harness')).panelModule('GithubConfigsPanel'),
);
vi.mock('../../../../src/pages/environment-variables/GodaddyConfigsPanel', async () =>
  (await import('./panel.harness')).panelModule('GodaddyConfigsPanel'),
);
vi.mock('../../../../src/pages/environment-variables/CloudflareConfigsPanel', async () =>
  (await import('./panel.harness')).panelModule('CloudflareConfigsPanel'),
);
vi.mock('../../../../src/pages/environment-variables/StripeConfigsPanel', async () =>
  (await import('./panel.harness')).panelModule('StripeConfigsPanel'),
);
vi.mock('../../../../src/pages/environment-variables/RazorpayConfigsPanel', async () =>
  (await import('./panel.harness')).panelModule('RazorpayConfigsPanel'),
);
vi.mock('../../../../src/pages/environment-variables/PaypalConfigsPanel', async () =>
  (await import('./panel.harness')).panelModule('PaypalConfigsPanel'),
);
vi.mock('../../../../src/pages/environment-variables/PayoneerConfigsPanel', async () =>
  (await import('./panel.harness')).panelModule('PayoneerConfigsPanel'),
);
vi.mock('../../../../src/pages/environment-variables/SonarConfigsPanel', async () =>
  (await import('./panel.harness')).panelModule('SonarConfigsPanel'),
);
vi.mock('../../../../src/pages/environment-variables/EmailAccountsPanel', async () => ({
  ...(await import('./panel.harness')).panelModule('EmailAccountsPanel'),
  EMAIL_ACCOUNTS_PATH: '/tech/environment-variables/email-accounts',
}));
vi.mock('../../../../src/pages/environment-variables/AiPricingPanel', async () =>
  (await import('./panel.harness')).panelModule('AiPricingPanel'),
);

function Url() {
  return <output aria-label="url">{useCurrentUrl()}</output>;
}

const renderAt = (route: string) =>
  renderWithProviders(
    <>
      <EnvironmentVariablesPage />
      <Url />
    </>,
    { route },
  );

describe('EnvironmentVariablesPage', () => {
  it('lives under /tech/environment-variables', () => {
    expect(ENVIRONMENT_VARIABLES_PATH).toBe('/tech/environment-variables');
  });

  it('lists every integration in the side menu, grouped by category', () => {
    renderAt('/tech/environment-variables/slack');
    const nav = screen.getByRole('navigation', { name: 'Integration credentials' });
    // Every group starts open, so the one toolbar toggle offers to collapse them all.
    const toggle = within(nav).getByRole('button', { name: 'Collapse all' });
    expect(
      within(nav)
        .getAllByRole('button', { expanded: true })
        .filter((button) => button !== toggle)
        .map((header) => header.textContent),
    ).toEqual([
      'Messaging & email',
      'Google',
      'Media',
      'AI',
      'Payments',
      'Domains & DNS',
      'Developer tools',
    ]);
    expect(within(nav).getByRole('button', { name: 'Slack' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('opens on the first integration when the address names none', async () => {
    renderAt('/tech/environment-variables');
    expect(await screen.findByTestId('SlackConfigsPanel')).toBeInTheDocument();
    expect(screen.getByLabelText('url')).toHaveTextContent('/tech/environment-variables/slack');
  });

  it.each([
    ['imagekit', 'ImageConfigsPanel'],
    ['pexels', 'PexelsConfigsPanel'],
    ['openai', 'OpenAiConfigsPanel'],
    ['ai-pricing', 'AiPricingPanel'],
    ['smtp', 'EmailConfigsPanel'],
    ['inbound-mail', 'InboundMailConfigsPanel'],
    ['github', 'GithubConfigsPanel'],
    ['godaddy', 'GodaddyConfigsPanel'],
    ['cloudflare', 'CloudflareConfigsPanel'],
    ['stripe', 'StripeConfigsPanel'],
    ['razorpay', 'RazorpayConfigsPanel'],
    ['paypal', 'PaypalConfigsPanel'],
    ['payoneer', 'PayoneerConfigsPanel'],
    ['sonarqube', 'SonarConfigsPanel'],
    ['email-accounts', 'EmailAccountsPanel'],
  ])('shows the %s panel at its own address', (slug, panel) => {
    renderAt(`/tech/environment-variables/${slug}`);
    expect(screen.getByRole('region')).toContainElement(screen.getByTestId(panel));
    expect(screen.queryByTestId('SlackConfigsPanel')).not.toBeInTheDocument();
  });

  it('lists both OAuth apps under one Email accounts entry, with no separate Gmail or Microsoft one', () => {
    renderAt('/tech/environment-variables/slack');
    const nav = screen.getByRole('navigation', { name: 'Integration credentials' });
    expect(within(nav).getByRole('button', { name: 'Email accounts (OAuth)' })).toBeInTheDocument();
    expect(within(nav).queryByRole('button', { name: 'Gmail' })).not.toBeInTheDocument();
    expect(within(nav).queryByRole('button', { name: 'Microsoft Mail' })).not.toBeInTheDocument();
  });

  it('moves to another integration when its menu entry is chosen', async () => {
    renderAt('/tech/environment-variables/slack');
    await userEvent.click(screen.getByRole('button', { name: 'Stripe' }));
    expect(await screen.findByTestId('StripeConfigsPanel')).toBeInTheDocument();
    expect(screen.getByLabelText('url')).toHaveTextContent('/tech/environment-variables/stripe');
  });
});
