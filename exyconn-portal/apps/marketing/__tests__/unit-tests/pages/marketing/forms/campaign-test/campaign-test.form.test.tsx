import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { PreviewRecordKind } from '@exyconn/shell/graphql/generated';
import {
  CampaignTestForm,
  campaignTestSchema,
} from '../../../../../../src/pages/marketing/forms/campaign-test';
import { renderWithProviders } from '../../../../test-utils';
import { fill, press } from '../../../../form-helpers';

const gql = vi.hoisted(() => ({ sendTest: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSendCampaignTestMutation: () => [gql.sendTest],
}));

const RECORD = { kind: PreviewRecordKind.Contact, id: 'contact-9', name: 'Asha Rao' };

function renderTest(
  record: typeof RECORD | null = null,
  beforeSend = vi.fn().mockResolvedValue(undefined),
) {
  renderWithProviders(
    <CampaignTestForm campaignId="campaign-4" record={record} beforeSend={beforeSend} />,
  );
  return { beforeSend };
}

describe('CampaignTestForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.sendTest.mockResolvedValue({ data: { sendCampaignTest: true } });
  });

  it('says a test uses sample data when no record is chosen', () => {
    renderTest();

    expect(
      screen.getByText(
        'Personalised with sample data. Marked [TEST]; no tracking; its links cannot unsubscribe anyone.',
      ),
    ).toBeInTheDocument();
  });

  it('names the record the test is personalised as', () => {
    renderTest(RECORD);

    expect(
      screen.getByText(
        'Personalised as Asha Rao. Marked [TEST]; no tracking; its links cannot unsubscribe anyone.',
      ),
    ).toBeInTheDocument();
  });

  it('needs an address', async () => {
    renderTest();

    await press('Send test email');

    expect(await screen.findByText('Enter the address to send the test to')).toBeInTheDocument();
    expect(gql.sendTest).not.toHaveBeenCalled();
  });

  it('rejects a malformed address', async () => {
    renderTest();
    fill('Send a test to', 'not-an-email');

    await press('Send test email');

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(gql.sendTest).not.toHaveBeenCalled();
  });

  it('saves the draft, then sends the test with sample data', async () => {
    const { beforeSend } = renderTest();
    fill('Send a test to', '  ravi@exyconn.com ');

    await press('Send test email');

    expect(await screen.findByText('Test email sent to ravi@exyconn.com')).toBeInTheDocument();
    expect(gql.sendTest).toHaveBeenCalledWith({
      variables: { id: 'campaign-4', to: 'ravi@exyconn.com', recordKind: null, recordId: null },
    });
    expect(beforeSend.mock.invocationCallOrder[0]).toBeLessThan(
      gql.sendTest.mock.invocationCallOrder[0],
    );
  });

  it('sends the test personalised as the chosen record', async () => {
    renderTest(RECORD);
    fill('Send a test to', 'ravi@exyconn.com');

    await press('Send test email');

    expect(await screen.findByText('Test email sent to ravi@exyconn.com')).toBeInTheDocument();
    expect(gql.sendTest).toHaveBeenCalledWith({
      variables: {
        id: 'campaign-4',
        to: 'ravi@exyconn.com',
        recordKind: PreviewRecordKind.Contact,
        recordId: 'contact-9',
      },
    });
  });

  it('reports a failed draft save without sending', async () => {
    renderTest(null, vi.fn().mockRejectedValue(new Error('Subject is required')));
    fill('Send a test to', 'ravi@exyconn.com');

    await press('Send test email');

    expect(await screen.findByText('Subject is required')).toBeInTheDocument();
    expect(gql.sendTest).not.toHaveBeenCalled();
  });

  it('falls back to a plain message when sending fails without one', async () => {
    gql.sendTest.mockRejectedValue('boom');
    renderTest();
    fill('Send a test to', 'ravi@exyconn.com');

    await press('Send test email');

    expect(await screen.findByText('The test email could not be sent')).toBeInTheDocument();
  });

  it('clears the address on Cancel', async () => {
    renderTest();
    fill('Send a test to', 'ravi@exyconn.com');

    await press('Cancel');

    expect(screen.getByLabelText(/^Send a test to\s*\*?$/)).toHaveValue('');
  });
});

describe('campaignTestSchema', () => {
  it('trims the address it accepts', () => {
    expect(campaignTestSchema.parse({ to: ' a@b.co ' })).toEqual({ to: 'a@b.co' });
  });
});
