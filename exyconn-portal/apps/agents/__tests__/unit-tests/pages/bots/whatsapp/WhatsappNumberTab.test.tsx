import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { WhatsappNumberTab } from '../../../../../src/pages/bots/whatsapp/WhatsappNumberTab';
import { renderWithProviders } from '../../../test-utils';

vi.mock('../../../../../src/pages/bots/whatsapp/WhatsappChannelPanel', async () =>
  (await import('../../environment-variables/panel.harness')).panelModule('WhatsappChannelPanel'),
);

describe('WhatsappNumberTab', () => {
  it('explains what the number is for, links its AI key, and holds the number settings', () => {
    renderWithProviders(<WhatsappNumberTab />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      /^The demo chat on demos\.exyconn\.com needs nothing here\./,
    );
    expect(
      screen.getByRole('link', { name: 'Environment variables > OpenAI' }).getAttribute('href'),
    ).toMatch(/\/tech\/environment-variables\/openai$/);
    expect(screen.getByTestId('WhatsappChannelPanel')).toBeInTheDocument();
  });
});
