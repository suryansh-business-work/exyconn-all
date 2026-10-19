import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RedirectUriInfo } from '../../../../src/pages/environment-variables/RedirectUriInfo';
import { renderWithProviders } from '../../test-utils';
import { notify, resetHarness } from './panel.harness';

const clipboard = vi.hoisted(() => ({ copyToClipboard: vi.fn() }));

vi.mock('@exyconn/shell/utils/clipboard', () => clipboard);
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) =>
  (await import('./panel.harness')).notifyModule(importOriginal),
);

const URI = 'https://portal-server.example.test/oauth/microsoft/callback';
const INSTRUCTIONS =
  'Register this address and grant the Mail.Send, User.Read and offline_access permissions:';
const copyButton = () => screen.getByRole('button', { name: 'Copy the redirect URI' });

describe('RedirectUriInfo', () => {
  beforeEach(() => {
    resetHarness();
    clipboard.copyToClipboard.mockReset();
  });

  it('shows the address to register and the instructions it was given', () => {
    renderWithProviders(<RedirectUriInfo uri={URI} instructions={INSTRUCTIONS} />);
    expect(screen.getByText(URI)).toBeInTheDocument();
    expect(screen.getByText(/Mail\.Send, User\.Read and offline_access/)).toBeInTheDocument();
  });

  it('copies the address and says so', async () => {
    clipboard.copyToClipboard.mockResolvedValue(true);
    renderWithProviders(<RedirectUriInfo uri={URI} instructions={INSTRUCTIONS} />);
    await userEvent.click(copyButton());
    expect(clipboard.copyToClipboard).toHaveBeenCalledWith(URI);
    await waitFor(() => expect(notify).toHaveBeenCalledWith('Redirect URI copied', 'info'));
  });

  it('says the copy failed when the browser refused it', async () => {
    clipboard.copyToClipboard.mockResolvedValue(false);
    renderWithProviders(<RedirectUriInfo uri={URI} instructions={INSTRUCTIONS} />);
    await userEvent.click(copyButton());
    await waitFor(() => expect(notify).toHaveBeenCalledWith('Copy failed', 'info'));
  });

  it('says the copy failed when copying throws', async () => {
    clipboard.copyToClipboard.mockRejectedValue(new Error('no clipboard'));
    renderWithProviders(<RedirectUriInfo uri={URI} instructions={INSTRUCTIONS} />);
    await userEvent.click(copyButton());
    await waitFor(() => expect(notify).toHaveBeenCalledWith('Copy failed', 'info'));
  });
});
