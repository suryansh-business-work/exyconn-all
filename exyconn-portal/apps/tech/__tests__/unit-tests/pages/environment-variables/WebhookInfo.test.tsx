import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { env } from '@exyconn/shell/config/env';
import { WebhookInfo } from '../../../../src/pages/environment-variables/WebhookInfo';
import { renderWithProviders } from '../../test-utils';
import { notify, resetHarness } from './panel.harness';

const clipboard = vi.hoisted(() => ({ copyToClipboard: vi.fn() }));

vi.mock('@exyconn/shell/utils/clipboard', () => clipboard);
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) =>
  (await import('./panel.harness')).notifyModule(importOriginal),
);

const URL_TEXT = new URL('/webhooks/stripe', env.graphqlUrl).toString();

const renderInfo = (events?: readonly string[]) =>
  renderWithProviders(
    <WebhookInfo
      title="Webhook endpoint"
      path="/webhooks/stripe"
      description="Add this endpoint in the Stripe dashboard."
      events={events}
    />,
  );

describe('WebhookInfo', () => {
  beforeEach(() => {
    resetHarness();
    clipboard.copyToClipboard.mockReset();
  });

  it('shows the title, what to do and the full API address', () => {
    renderInfo();
    expect(screen.getByText('Webhook endpoint')).toBeInTheDocument();
    expect(screen.getByText('Add this endpoint in the Stripe dashboard.')).toBeInTheDocument();
    expect(screen.getByText(URL_TEXT)).toBeInTheDocument();
    expect(screen.queryByText(/^Events:/)).not.toBeInTheDocument();
  });

  it('lists the events to subscribe to when the gateway needs them', () => {
    renderInfo(['checkout.session.completed', 'charge.refunded']);
    expect(
      screen.getByText('Events: checkout.session.completed, charge.refunded'),
    ).toBeInTheDocument();
  });

  it('copies the address and says so', async () => {
    clipboard.copyToClipboard.mockResolvedValue(true);
    renderInfo();
    await userEvent.click(screen.getByRole('button', { name: 'Copy the webhook URL' }));
    expect(clipboard.copyToClipboard).toHaveBeenCalledWith(URL_TEXT);
    await waitFor(() => expect(notify).toHaveBeenCalledWith('Webhook URL copied', 'info'));
  });

  it('says the copy failed when the browser refused it', async () => {
    clipboard.copyToClipboard.mockResolvedValue(false);
    renderInfo();
    await userEvent.click(screen.getByRole('button', { name: 'Copy the webhook URL' }));
    await waitFor(() => expect(notify).toHaveBeenCalledWith('Copy failed', 'info'));
  });

  it('says the copy failed when copying throws', async () => {
    clipboard.copyToClipboard.mockRejectedValue(new Error('no clipboard'));
    renderInfo();
    await userEvent.click(screen.getByRole('button', { name: 'Copy the webhook URL' }));
    await waitFor(() => expect(notify).toHaveBeenCalledWith('Copy failed', 'info'));
  });
});
