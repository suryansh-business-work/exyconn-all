import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { ChatSettingsPage } from '../../../../../src/pages/chat/settings/ChatSettingsPage';
import type { ChatSettingsRow } from '../../../../../src/pages/chat/forms/chat-settings';
import { renderWithProviders } from '../../../test-utils';

const query = vi.hoisted(() => ({
  result: { data: undefined as unknown, loading: false, error: undefined as Error | undefined },
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@exyconn/shell/graphql/generated')>();
  return { ...actual, useWebsiteChatSettingsQuery: () => query.result };
});

vi.mock('../../../../../src/pages/chat/forms/chat-settings', async () => {
  const { ChatSettingsFormStub } = await import('./settings-form-stub');
  return { ChatSettingsForm: ChatSettingsFormStub };
});

function settings(overrides: Partial<ChatSettingsRow> = {}): ChatSettingsRow {
  return {
    __typename: 'WebsiteChatSettings',
    enabled: true,
    botName: 'Exy',
    welcomeMessage: 'Hi! How can we help?',
    offlineMessage: 'We are away right now.',
    handoffMessage: 'Connecting you to the team.',
    refusalMessage: 'I cannot help with that.',
    customInstructions: '',
    timezone: 'Asia/Kolkata',
    noReplyTimeoutSeconds: 120,
    botModel: 'gpt-4o-mini',
    maxContextChars: 12_000,
    allowUploads: true,
    maxUploadMb: 10,
    soundEnabledByDefault: true,
    transcriptOnClose: true,
    sessionTimeoutMinutes: 30,
    embeddingModel: 'text-embedding-3-small',
    agentIds: [],
    slackEnabled: false,
    online: true,
    knowledgeSyncedAt: null,
    knowledgeSyncCount: 0,
    knowledgeSyncError: '',
    updatedAt: '2026-10-07T09:00:00.000Z',
    weeklyHours: [],
    ...overrides,
  };
}

function loaded(row: ChatSettingsRow) {
  return { data: { websiteChatSettings: row }, loading: false, error: undefined };
}

beforeEach(() => {
  query.result = { data: undefined, loading: false, error: undefined };
});

describe('ChatSettingsPage', () => {
  it('opens the settings form and says the team is online', () => {
    query.result = loaded(settings());
    renderWithProviders(<ChatSettingsPage />);

    expect(screen.getByRole('heading', { name: 'Chatbot settings' })).toBeInTheDocument();
    expect(screen.getByRole('form', { name: 'Chatbot settings form' })).toHaveTextContent(
      'Editing Exy',
    );
    expect(screen.getByRole('status')).toHaveTextContent('Online now');
  });

  it('says the team is offline outside the opening hours', () => {
    query.result = loaded(settings({ online: false }));
    renderWithProviders(<ChatSettingsPage />);
    expect(screen.getByRole('status')).toHaveTextContent('Offline now');
  });

  it('shows a spinner and no status while the settings load', () => {
    query.result = { data: undefined, loading: true, error: undefined };
    renderWithProviders(<ChatSettingsPage />);

    expect(
      screen.getByRole('progressbar', { name: 'Loading the chatbot settings' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/now$/)).toBeNull();
    expect(screen.queryByRole('form')).toBeNull();
  });

  it('shows why the settings could not be loaded', () => {
    query.result = { data: undefined, loading: false, error: new Error('Network is down') };
    renderWithProviders(<ChatSettingsPage />);
    expect(screen.getByRole('alert')).toHaveTextContent('Network is down');
  });

  it('falls back to a plain message when there is neither data nor an error', () => {
    renderWithProviders(<ChatSettingsPage />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'The chatbot settings could not be loaded.',
    );
  });
});
