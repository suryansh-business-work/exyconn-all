import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { copyToClipboard } from '@exyconn/shell/utils/clipboard';
import { ChatSlackFields } from '../../../../../../src/pages/chat/forms/chat-settings/chat-slack.fields';
import { SettingsSection } from '../../../../../../src/pages/chat/forms/chat-settings/SettingsSection';
import { renderWithProviders } from '../../../../test-utils';
import { SettingsHarness } from './settings-harness';

vi.mock('@exyconn/shell/config/env', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@exyconn/shell/config/env')>();
  return { env: { ...actual.env, graphqlUrl: 'https://portal-server.exyconn.com/graphql' } };
});
vi.mock('@exyconn/shell/utils/clipboard', () => ({ copyToClipboard: vi.fn() }));

const REQUEST_URL = 'https://portal-server.exyconn.com/slack/events';

function renderSlack() {
  renderWithProviders(
    <SettingsHarness>
      <ChatSlackFields />
    </SettingsHarness>,
  );
}

const copyButton = () => screen.getByRole('button', { name: 'Copy the Request URL' });

describe('ChatSlackFields', () => {
  beforeEach(() => {
    vi.mocked(copyToClipboard).mockReset().mockResolvedValue(true);
  });

  it('switches Slack mirroring on and off, explaining what it does', async () => {
    renderSlack();
    const toggle = screen.getByLabelText('Notify the assigned agent on Slack');

    expect(screen.getByRole('heading', { name: 'Slack' })).toBeInTheDocument();
    expect(screen.getByText(/gets a Slack DM thread for each chat/)).toBeInTheDocument();
    expect(toggle).not.toBeChecked();
    await userEvent.click(toggle);
    expect(toggle).toBeChecked();
  });

  it('shows the Request URL on the portal API, next to /graphql', () => {
    renderSlack();
    expect(screen.getByText(REQUEST_URL)).toBeInTheDocument();
    expect(screen.getByText(/subscribed to the message.im event/)).toBeInTheDocument();
  });

  it('copies the Request URL and says so', async () => {
    renderSlack();
    await userEvent.click(copyButton());

    expect(copyToClipboard).toHaveBeenCalledWith(REQUEST_URL);
    expect(await screen.findByText('Request URL copied')).toBeInTheDocument();
  });

  it('says when the browser would not copy', async () => {
    vi.mocked(copyToClipboard).mockResolvedValue(false);
    renderSlack();
    await userEvent.click(copyButton());

    expect(await screen.findByText('Copy failed')).toBeInTheDocument();
  });

  it('says when copying broke altogether', async () => {
    vi.mocked(copyToClipboard).mockRejectedValue(new Error('Clipboard unavailable'));
    renderSlack();
    await userEvent.click(copyButton());

    expect(await screen.findByText('Copy failed')).toBeInTheDocument();
  });
});

describe('SettingsSection', () => {
  it('titles a group of settings and describes it, in the viewer’s language', () => {
    renderWithProviders(
      <SettingsSection title="Behaviour" description="How the widget works.">
        <p>Fields</p>
      </SettingsSection>,
      { locale: 'fr', messages: { Behaviour: 'Comportement' } },
    );

    expect(screen.getByRole('heading', { level: 2, name: 'Comportement' })).toBeInTheDocument();
    expect(screen.getByText('How the widget works.')).toBeInTheDocument();
    expect(screen.getByText('Fields')).toBeInTheDocument();
  });
});
