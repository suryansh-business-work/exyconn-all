import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { EmailPanel } from '../../../../../src/records/comms/panels/EmailPanel';
import { renderWithProviders } from '../../../test-utils';
import { commsPanel } from '../comms-fixtures';

const gql = vi.hoisted(() => ({ sendVariant: vi.fn(), sendPlain: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSendColdEmailVariantMutation: () => [gql.sendVariant],
  useSendCrmEmailMutation: () => [gql.sendPlain],
  useDraftCrmEmailMutation: () => [vi.fn(), { loading: false }],
  useCrmEmailSendersQuery: () => ({
    data: { crmEmailSenders: [{ id: 'acc-1', email: 'sales@exyconn.com', provider: 'GMAIL' }] },
    loading: false,
  }),
  useCrmEmailSenderQuery: () => ({ data: { crmEmailSender: 'acc-1' } }),
}));

const COLD = commsPanel({
  channel: 'EMAIL',
  object: 'COMPANY',
  id: 'co-1',
  name: 'Acme',
  emails: ['hello@acme.com'],
  key: 'EMAIL:COMPANY:co-1:v1',
  coldEmail: { draftId: 'draft-1', variantId: 'v1', subject: 'Hi Acme', body: 'Short note.' },
});

describe('a cold email in the dock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.sendVariant.mockResolvedValue({});
    vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
  });

  it('is prefilled to the draft’s address and sent as that version, so it is tracked', async () => {
    const onClose = vi.fn();
    renderWithProviders(<EmailPanel panel={COLD} onClose={onClose} />);

    expect(screen.getByLabelText(/^To\s*\*?$/)).toHaveValue('hello@acme.com');
    expect(screen.queryByLabelText(/^Cc\s*\*?$/)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/^Subject\s*\*?$/)).toHaveValue('Hi Acme');
    expect(screen.getByLabelText(/^Message\s*\*?$/)).toHaveValue('Short note.');

    await userEvent.type(screen.getByLabelText(/^Message\s*\*?$/), ' Thanks!');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(gql.sendVariant).toHaveBeenCalledWith({
      variables: {
        input: {
          draftId: 'draft-1',
          variantId: 'v1',
          fromAccountId: 'acc-1',
          subject: 'Hi Acme',
          body: 'Short note. Thanks!',
        },
      },
    });
    expect(gql.sendPlain).not.toHaveBeenCalled();
  });

  it('keeps the panel open with the reason when the send fails', async () => {
    gql.sendVariant.mockRejectedValue(
      new Error('That version was already sent or no longer exists.'),
    );
    const onClose = vi.fn();
    renderWithProviders(<EmailPanel panel={COLD} onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(
      await screen.findByText('That version was already sent or no longer exists.'),
    ).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
