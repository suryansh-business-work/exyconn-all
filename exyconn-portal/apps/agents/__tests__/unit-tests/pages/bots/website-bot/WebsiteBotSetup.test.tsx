import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { WIDGET_PLATFORMS } from '@exyconn/bot-studio/widget';
import { appBaseUrl } from '@exyconn/shell/config/apps';
import { WebsiteBotSetup } from '../../../../../src/pages/bots/website-bot/WebsiteBotSetup';
import { renderWithProviders } from '../../../test-utils';

const api = vi.hoisted(() => ({
  status: undefined as { configured: boolean; model?: string | null } | undefined,
  loading: false,
  options: null as unknown,
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useWhatsappDemoAiStatusQuery: (options: unknown) => {
    api.options = options;
    const data = api.status ? { whatsappDemoAiStatus: api.status } : undefined;
    return { data, loading: api.loading };
  },
}));

beforeEach(() => {
  api.status = undefined;
  api.loading = false;
});

describe('WebsiteBotSetup', () => {
  it('links to the live demo and lists the platforms the widget runs on', () => {
    renderWithProviders(<WebsiteBotSetup />);
    expect(screen.getByRole('link', { name: 'Open the demo' })).toHaveAttribute(
      'href',
      appBaseUrl('website-chat-demo'),
    );
    expect(screen.getByRole('link', { name: 'Open the demo' })).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );
    for (const platform of WIDGET_PLATFORMS) {
      expect(screen.getByText(platform)).toBeInTheDocument();
    }
    expect(api.options).toEqual({ fetchPolicy: 'cache-and-network' });
  });

  it('says nothing about AI until the status first answers', () => {
    api.loading = true;
    renderWithProviders(<WebsiteBotSetup />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('names the model free text is read with when AI is on', () => {
    api.loading = true;
    api.status = { configured: true, model: 'gpt-4o-mini' };
    renderWithProviders(<WebsiteBotSetup />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'AI answers are on: free text is read with gpt-4o-mini.',
    );
  });

  it('falls back to OpenAI when the status names no model', () => {
    api.status = { configured: true, model: null };
    renderWithProviders(<WebsiteBotSetup />);
    expect(screen.getByRole('alert')).toHaveTextContent('free text is read with OpenAI.');
  });

  it('explains showcase mode and where to add the OpenAI key', () => {
    api.status = { configured: false };
    renderWithProviders(<WebsiteBotSetup />);
    expect(screen.getByRole('alert')).toHaveTextContent(/^Showcase mode/);
    expect(screen.getByRole('link', { name: 'Environment variables > OpenAI' })).toHaveAttribute(
      'href',
      '/tech/environment-variables/openai',
    );
  });
});
