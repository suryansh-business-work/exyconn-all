import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { SendTestSlackForm } from '../../../../../../src/pages/environment-variables/forms/send-test-slack';
import { renderWithProviders } from '../../../../test-utils';
import { doneOnce, expectMessages, fill, formCallbacks, press, toast } from '../form.helpers';

const gql = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSendTestSlackMessageMutation: () => [gql.send],
}));

const cb = formCallbacks();

const renderForm = (defaultChannel?: string) =>
  renderWithProviders(
    <SendTestSlackForm
      configId="slack-1"
      configLabel="Releases bot"
      defaultChannel={defaultChannel}
      onDone={cb.onDone}
      onCancel={cb.onCancel}
    />,
  );

describe('SendTestSlackForm', () => {
  beforeEach(() => {
    gql.send.mockReset().mockResolvedValue({ data: {} });
    cb.reset();
  });

  it('names the bot it verifies and starts with no channel', () => {
    renderForm();
    expect(screen.getByText(/Verify the “Releases bot” bot token/)).toBeInTheDocument();
    expect(screen.getByLabelText('Channel')).toHaveValue('');
  });

  it('asks for a channel and refuses an overlong one', async () => {
    renderForm();
    await press('Send test');
    await expectMessages('Channel is required');

    fill('Channel', `#${'c'.repeat(80)}`);
    await press('Send test');
    await expectMessages('Channel name is too long');
    expect(gql.send).not.toHaveBeenCalled();
  });

  it('posts to the default channel through this config', async () => {
    renderForm('#releases');
    expect(screen.getByLabelText('Channel')).toHaveValue('#releases');
    await press('Send test');

    await doneOnce(cb.onDone);
    expect(gql.send).toHaveBeenCalledWith({
      variables: { id: 'slack-1', channel: '#releases' },
    });
    expect(await toast()).toHaveTextContent('Test message posted to #releases');
  });

  it('posts to a channel typed in instead', async () => {
    renderForm('#releases');
    fill('Channel', '#ops');
    await press('Send test');
    await doneOnce(cb.onDone);
    expect(gql.send).toHaveBeenCalledWith({ variables: { id: 'slack-1', channel: '#ops' } });
  });

  it('shows Slack’s reason when the post fails', async () => {
    gql.send.mockRejectedValue(new Error('not_in_channel'));
    renderForm('#releases');
    await press('Send test');
    expect(await toast()).toHaveTextContent('not_in_channel');
    expect(cb.onDone).not.toHaveBeenCalled();
  });

  it('says the send failed when the error carries no message', async () => {
    gql.send.mockRejectedValue(null);
    renderForm('#releases');
    await press('Send test');
    expect(await toast()).toHaveTextContent('Send failed');
  });

  it('hands control back on Cancel', async () => {
    renderForm();
    await press('Cancel');
    expect(cb.onCancel).toHaveBeenCalledTimes(1);
  });
});
