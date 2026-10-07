import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { SendCampaignForm } from '../../../../../../src/pages/marketing/forms/send-campaign';
import type { CampaignRow } from '../../../../../../src/pages/marketing/forms/campaign';
import { renderWithProviders } from '../../../../test-utils';
import { campaignRow } from '../../../../fixtures';
import { chooseOption, fill, press } from '../../../../form-helpers';

const gql = vi.hoisted(() => ({ send: vi.fn(), audiences: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSendCampaignMutation: () => [gql.send],
  useListAudienceListsQuery: () => gql.audiences(),
}));

vi.mock('../../../../../../src/pages/marketing/forms/send-campaign/SendPreview', () => ({
  SendPreview: ({ campaignId, audienceListId }: Readonly<Record<string, string>>) => (
    <p>{`Preview of ${campaignId} for ${audienceListId}`}</p>
  ),
}));

function renderForm(campaign: CampaignRow = campaignRow()) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(<SendCampaignForm campaign={campaign} onDone={onDone} onCancel={onCancel} />);
  return { onDone, onCancel };
}

async function sendToNewsletter() {
  await chooseOption('Audience', 'Newsletter');
  await press('Send');
}

describe('SendCampaignForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.audiences.mockReturnValue({
      data: { listAudienceLists: [{ id: 'audience-1', name: 'Newsletter' }] },
    });
    gql.send.mockResolvedValue({ data: { sendCampaign: { sent: 4, failed: 0, skipped: 0 } } });
  });

  it('names the campaign and its subject, ready to send', () => {
    renderForm();

    expect(screen.getByText('Sending “Diwali offer” — “Festive savings”.')).toBeInTheDocument();
    expect(screen.queryByText(/Add an email subject and body/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send test' })).toBeEnabled();
  });

  it('warns, and blocks the test send, while the email has no subject or body', () => {
    renderForm(campaignRow({ subject: '', body: '' }));

    expect(screen.getByText('Sending “Diwali offer”.')).toBeInTheDocument();
    expect(
      screen.getByText('Add an email subject and body to this campaign before sending.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send test' })).toBeDisabled();
  });

  it('requires an audience before the blast', async () => {
    renderForm();

    await press('Send');

    expect(await screen.findByText('Choose the audience to send to')).toBeInTheDocument();
    expect(gql.send).not.toHaveBeenCalled();
  });

  it('previews the chosen audience and says where to create one when there is none', async () => {
    renderForm();
    expect(screen.queryByText(/Preview of/)).not.toBeInTheDocument();

    await chooseOption('Audience', 'Newsletter');

    expect(screen.getByText('Preview of campaign-1 for audience-1')).toBeInTheDocument();
  });

  it('says to create an audience first when there is none', () => {
    gql.audiences.mockReturnValue({ data: undefined });
    renderForm();

    expect(screen.getByText('No audiences yet — create one first.')).toBeInTheDocument();
  });

  it.each([
    [4, 0, 0, 'Campaign sent to 4 recipient(s)'],
    [4, 1, 0, 'Campaign sent to 4 recipient(s) · 1 failed'],
    [4, 0, 2, 'Campaign sent to 4 recipient(s) · 2 skipped'],
    [4, 1, 2, 'Campaign sent to 4 recipient(s) · 1 failed · 2 skipped'],
  ])(
    'reports %i sent, %i failed, %i skipped in one sentence',
    async (sent, failed, skipped, line) => {
      gql.send.mockResolvedValue({ data: { sendCampaign: { sent, failed, skipped } } });
      const { onDone } = renderForm();

      await sendToNewsletter();

      await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
      expect(gql.send).toHaveBeenCalledWith({
        variables: { id: 'campaign-1', audienceListId: 'audience-1' },
      });
      expect(await screen.findByText(line)).toBeInTheDocument();
    },
  );

  it('counts nothing sent when the server returns no result', async () => {
    gql.send.mockResolvedValue({ data: undefined });
    const { onDone } = renderForm();

    await sendToNewsletter();

    expect(await screen.findByText('Campaign sent to 0 recipient(s)')).toBeInTheDocument();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it.each([
    [new Error('SMTP is not configured'), 'SMTP is not configured'],
    ['offline', 'Send failed'],
  ])('keeps the form open when the send fails (%s)', async (failure, message) => {
    gql.send.mockRejectedValueOnce(failure);
    const { onDone } = renderForm();

    await sendToNewsletter();

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('asks for an address before a test send', async () => {
    renderForm();

    await press('Send test');

    expect(await screen.findByText('Enter the address to send the test to')).toBeInTheDocument();
    expect(gql.send).not.toHaveBeenCalled();
  });

  it('refuses a malformed test address', async () => {
    renderForm();
    fill('Test address', 'not-an-email');

    await press('Send test');

    expect(await screen.findByText('Enter a valid email')).toBeInTheDocument();
    expect(gql.send).not.toHaveBeenCalled();
  });

  it('sends one test copy to the trimmed address', async () => {
    const { onDone } = renderForm();
    fill('Test address', ' me@acme.io ');

    await press('Send test');

    expect(await screen.findByText('Test email sent to me@acme.io')).toBeInTheDocument();
    expect(gql.send).toHaveBeenCalledWith({
      variables: { id: 'campaign-1', testEmail: 'me@acme.io' },
    });
    expect(onDone).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Send test' })).toBeEnabled();
  });

  it.each([
    [new Error('Mailbox full'), 'Mailbox full'],
    [42, 'Test send failed'],
  ])('reports a failed test send (%s)', async (failure, message) => {
    gql.send.mockRejectedValueOnce(failure);
    renderForm();
    fill('Test address', 'me@acme.io');

    await press('Send test');

    expect(await screen.findByText(message)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Send test' })).toBeEnabled());
  });
});
