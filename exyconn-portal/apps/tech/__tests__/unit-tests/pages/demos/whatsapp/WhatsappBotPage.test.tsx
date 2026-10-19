import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { WhatsappBotPage } from '../../../../../src/pages/demos/whatsapp/WhatsappBotPage';
import { renderWithProviders } from '../../../test-utils';

vi.mock('../../../../../src/pages/demos/whatsapp/WhatsappChannelPanel', async () =>
  (await import('../../environment-variables/panel.harness')).panelModule('WhatsappChannelPanel'),
);

describe('WhatsappBotPage', () => {
  it('explains what the number is for, links its AI key, and holds the number settings', () => {
    renderWithProviders(<WhatsappBotPage />);
    expect(screen.getByRole('heading', { name: 'WhatsApp bot' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      /^The demo chat on demos\.exyconn\.com needs nothing here\./,
    );
    expect(screen.getByRole('link', { name: 'Environment variables > OpenAI' })).toHaveAttribute(
      'href',
      '/tech/environment-variables/openai',
    );
    expect(screen.getByTestId('WhatsappChannelPanel')).toBeInTheDocument();
  });
});
