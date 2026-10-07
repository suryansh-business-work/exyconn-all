import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WebsiteChatSettingsDocument } from '@exyconn/shell/graphql/generated';
import {
  ChatSettingsForm,
  toChatSettingsValues,
} from '../../../../../../src/pages/chat/forms/chat-settings';
import { renderWithProviders } from '../../../../test-utils';
import { settingsRow } from '../../chat-fixtures';

const gql = vi.hoisted(() => ({ update: vi.fn(), updateOptions: null as unknown }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useUpdateWebsiteChatSettingsMutation: (options: unknown) => {
    gql.updateOptions = options;
    return [gql.update];
  },
  useWebsiteChatAgentCandidatesQuery: () => ({
    data: { websiteChatAgentCandidates: [] },
    loading: false,
    error: undefined,
  }),
}));

const ROW = settingsRow();

const renderForm = () => renderWithProviders(<ChatSettingsForm initial={ROW} />);
const botName = () => screen.getByLabelText('Bot name');
const save = () => userEvent.click(screen.getByRole('button', { name: 'Save settings' }));

describe('ChatSettingsForm', () => {
  beforeEach(() => {
    gql.update.mockReset().mockResolvedValue({ data: {} });
  });

  it('opens with the saved settings in every section', () => {
    renderForm();

    for (const heading of ['Behaviour', 'Messages', 'Opening hours', 'Chat agents', 'Slack']) {
      expect(screen.getByRole('heading', { level: 2, name: heading })).toBeInTheDocument();
    }
    expect(botName()).toHaveValue('Exy');
    expect(screen.getByLabelText('Largest upload (MB)')).toHaveValue(5);
    expect(screen.getByLabelText('Bot model')).toHaveValue('gpt-4o');
    expect(screen.getByLabelText('Custom instructions')).toHaveValue('Friendly, short answers.');
    expect(screen.getByRole('combobox', { name: 'Timezone' })).toBe(
      screen.getByDisplayValue(/Kolkata/),
    );
  });

  it('lists the week from Sunday, open or closed as saved', () => {
    renderForm();

    for (const day of ['Sunday', 'Monday', 'Saturday']) {
      expect(screen.getByText(day)).toBeInTheDocument();
    }
    expect(screen.getAllByRole('switch', { name: 'Closed' })).toHaveLength(1);
    expect(screen.getAllByRole('switch', { name: 'Open' })).toHaveLength(6);
  });

  it('relabels a day as it is opened', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('switch', { name: 'Closed' }));

    expect(screen.queryByRole('switch', { name: 'Closed' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('switch', { name: 'Open' })).toHaveLength(7);
  });

  it('saves the settings, then confirms and refreshes them', async () => {
    renderForm();
    fireEvent.change(botName(), { target: { value: '  Exy Bot  ' } });
    fireEvent.change(screen.getByLabelText('Largest upload (MB)'), { target: { value: '8' } });
    await save();

    expect(await screen.findByText('Chatbot settings saved')).toBeInTheDocument();
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        input: { ...toChatSettingsValues(ROW), botName: 'Exy Bot', maxUploadMb: 8 },
      },
    });
    expect(gql.updateOptions).toEqual({ refetchQueries: [WebsiteChatSettingsDocument] });
  });

  it('shows what is wrong and saves nothing', async () => {
    renderForm();
    fireEvent.change(botName(), { target: { value: 'E' } });
    fireEvent.change(screen.getByLabelText('No-reply timeout (seconds)'), {
      target: { value: '5000' },
    });
    await save();

    expect(await screen.findByText('Bot name needs at least 2 characters')).toBeInTheDocument();
    expect(screen.getByText('No-reply timeout can be at most 3600')).toBeInTheDocument();
    expect(gql.update).not.toHaveBeenCalled();
  });

  it('says why the save failed', async () => {
    gql.update.mockRejectedValue(new Error('Only admins can change the chatbot'));
    renderForm();
    await save();

    expect(await screen.findByText('Only admins can change the chatbot')).toBeInTheDocument();
  });

  it('puts the saved settings back on Cancel', async () => {
    renderForm();
    fireEvent.change(botName(), { target: { value: 'Something else' } });
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(botName()).toHaveValue('Exy'));
    expect(gql.update).not.toHaveBeenCalled();
  });
});
