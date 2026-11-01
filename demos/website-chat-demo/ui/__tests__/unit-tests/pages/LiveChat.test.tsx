import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { LiveChat } from '../../../src/pages/website-chat/LiveChat';
import type { WebsiteDemo } from '../../../src/pages/website-chat/useWebsiteDemo';
import { site } from '../fixtures';
import { renderWithProviders } from '../test-utils';

vi.mock('@exyconn/bot-studio/widget', () => ({
  ChatWidget: ({ chat }: Readonly<{ chat: { bundle: { demo: { key: string } } } }>) => (
    <p>{`Chat widget for ${chat.bundle.demo.key}`}</p>
  ),
}));

function demo(state: { bundle?: boolean; loading?: boolean; error?: boolean; retry?: () => Promise<unknown> }) {
  return {
    chat: { bundle: state.bundle ? site('advisory') : null },
    loading: state.loading ?? false,
    error: state.error ? new Error('offline') : undefined,
    retry: state.retry ?? vi.fn().mockResolvedValue(undefined),
  } as unknown as WebsiteDemo;
}

describe('the live chat', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the site's agent, anchored for the Try it buttons", () => {
    const { container } = renderWithProviders(<LiveChat demo={demo({ bundle: true })} />);
    expect(screen.getByText('Chat widget for advisory')).toBeInTheDocument();
    expect(container.querySelector('#live-chat')).not.toBeNull();
  });

  it('keeps the chat on screen when a refresh fails', () => {
    renderWithProviders(<LiveChat demo={demo({ bundle: true, error: true })} />);
    expect(screen.getByText('Chat widget for advisory')).toBeInTheDocument();
  });

  it('holds a skeleton while the sites load', () => {
    renderWithProviders(<LiveChat demo={demo({ loading: true })} />);
    expect(screen.getByLabelText('Loading the chat')).toBeInTheDocument();
  });

  it('says when no site is published yet', () => {
    renderWithProviders(<LiveChat demo={demo({})} />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'No demo website is published yet. Publish one in Agents > Website chat agent.',
    );
  });

  it('offers a retry when the sites could not be loaded', async () => {
    const retry = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<LiveChat demo={demo({ error: true, retry })} />);
    expect(screen.getByRole('alert')).toHaveTextContent('The demo websites could not be loaded.');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('logs a retry that fails', async () => {
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    const retry = vi.fn().mockRejectedValue(new Error('still offline'));
    renderWithProviders(<LiveChat demo={demo({ error: true, retry })} />);
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await vi.waitFor(() => {
      expect(warn).toHaveBeenCalledWith('website chat demo: retry failed', expect.any(Error));
    });
  });
});
