import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { EmbedSnippet } from '../../../src/components/EmbedSnippet';
import { renderWithProviders } from '../test-utils';

const SNIPPET = '<script src="https://agent.example/widget.js"></script>';

function renderSnippet() {
  const user = userEvent.setup();
  renderWithProviders(<EmbedSnippet snippet={SNIPPET} platforms={['WordPress', 'Shopify']} />);
  return user;
}

describe('the install snippet', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the snippet in a keyboard-scrollable region and where it works', () => {
    renderSnippet();
    const region = screen.getByRole('region', { name: 'Example install snippet' });
    expect(region).toHaveTextContent(SNIPPET);
    expect(region).toHaveAttribute('tabindex', '0');
    expect(screen.getByText('WordPress')).toBeInTheDocument();
    expect(screen.getByText('Shopify')).toBeInTheDocument();
  });

  it('copies the snippet and says so', async () => {
    const user = renderSnippet();
    const writeText = vi.spyOn(globalThis.navigator.clipboard, 'writeText').mockResolvedValue();
    await user.click(screen.getByRole('button', { name: 'Copy' }));
    expect(writeText).toHaveBeenCalledWith(SNIPPET);
    expect(await screen.findByText('Snippet copied')).toBeInTheDocument();
  });

  it('tells the visitor to copy by hand when the clipboard refuses, and logs it', async () => {
    const user = renderSnippet();
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    vi.spyOn(globalThis.navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));
    await user.click(screen.getByRole('button', { name: 'Copy' }));
    expect(
      await screen.findByText('Could not copy. Select the text and copy it instead.'),
    ).toBeInTheDocument();
    expect(warn).toHaveBeenCalledWith('website chat demo: copy failed', expect.any(Error));
  });
});
