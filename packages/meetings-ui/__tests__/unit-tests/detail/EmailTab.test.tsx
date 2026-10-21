import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MaDeliveryStatus,
  MaEmailStatus,
  useMaEmailDeliveriesQuery,
  useMaEmailPreviewQuery,
  useMaRetryEmailDeliveryMutation,
  useMaSendSummaryEmailMutation,
} from '@exyconn/shell/graphql/generated';
import { EmailTab } from '../../../src/detail/email/EmailTab';
import { makeDelivery, makeMeeting } from '../fixtures';
import { mutationTuple, queryResult, renderWithProviders } from '../test-utils';

vi.mock('@exyconn/shell/graphql/generated', async (orig) => ({
  ...(await orig<typeof import('@exyconn/shell/graphql/generated')>()),
  useMaEmailDeliveriesQuery: vi.fn(),
  useMaEmailPreviewQuery: vi.fn(),
  useMaRetryEmailDeliveryMutation: vi.fn(),
  useMaSendSummaryEmailMutation: vi.fn(),
}));

const sendEmail = vi.fn();
const retryDelivery = vi.fn();
const PREVIEW = {
  maEmailPreview: {
    subject: 'Notes: Weekly sync',
    html: '<p>Hi</p><script>alert(1)</script>',
    recipients: ['ravi@example.com'],
  },
};

beforeEach(() => {
  sendEmail.mockReset().mockResolvedValue({});
  retryDelivery.mockReset().mockResolvedValue({});
  vi.mocked(useMaSendSummaryEmailMutation).mockReturnValue(mutationTuple(sendEmail) as never);
  vi.mocked(useMaRetryEmailDeliveryMutation).mockReturnValue(mutationTuple(retryDelivery) as never);
  vi.mocked(useMaEmailDeliveriesQuery).mockReturnValue(
    queryResult({
      maEmailDeliveries: [
        makeDelivery(),
        makeDelivery({
          id: 'delivery-2',
          recipient: 'asha@example.com',
          status: MaDeliveryStatus.Failed,
          error: 'Mailbox full',
          sentAt: null,
        }),
      ],
    }) as never,
  );
  vi.mocked(useMaEmailPreviewQuery).mockReturnValue(queryResult(PREVIEW) as never);
});

describe('EmailTab', () => {
  it('lists every delivery and retries only a failed one', async () => {
    renderWithProviders(<EmailTab meeting={makeMeeting()} />);
    expect(screen.getByText('Mailbox full')).toBeInTheDocument();
    expect(screen.getByText('Not sent')).toBeInTheDocument();
    const retries = screen.getAllByRole('button', { name: 'Retry sending' });
    expect(retries).toHaveLength(1);
    await userEvent.click(retries[0]);
    expect(retryDelivery).toHaveBeenCalledWith({ variables: { id: 'delivery-2' } });
    expect(await screen.findByText('Sending to asha@example.com again')).toBeInTheDocument();
  });

  it('sends the summary after a confirmation, re-reading the deliveries', async () => {
    const user = userEvent.setup();
    renderWithProviders(<EmailTab meeting={makeMeeting()} />);
    await user.click(screen.getByRole('button', { name: 'Send summary email' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Send' }));
    expect(sendEmail).toHaveBeenCalledWith({
      variables: { meetingId: 'meeting-1' },
      refetchQueries: ['MaEmailDeliveries'],
    });
    expect(await screen.findByText('Summary email queued')).toBeInTheDocument();
  });

  it('approves an email waiting for approval, and does nothing when cancelled', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <EmailTab meeting={makeMeeting({ emailStatus: MaEmailStatus.AwaitingApproval })} />,
    );
    await user.click(screen.getByRole('button', { name: 'Approve and send' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancel' }),
    );
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('previews the email in a sandboxed frame that cannot run its scripts', async () => {
    const user = userEvent.setup();
    renderWithProviders(<EmailTab meeting={makeMeeting()} />);
    expect(vi.mocked(useMaEmailPreviewQuery).mock.lastCall?.[0]).toMatchObject({ skip: true });
    await user.click(screen.getByRole('button', { name: 'Preview' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Notes: Weekly sync')).toBeInTheDocument();
    expect(within(dialog).getByText('To: ravi@example.com')).toBeInTheDocument();
    const frame = within(dialog).getByTitle('Email preview');
    expect(frame).toHaveAttribute('sandbox', '');
    expect(frame).toHaveAttribute('srcdoc', PREVIEW.maEmailPreview.html);
    await user.click(within(dialog).getByRole('button', { name: 'Close' }));
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('says when nobody would get the email, and shows the preview loading or failing', async () => {
    const user = userEvent.setup();
    vi.mocked(useMaEmailPreviewQuery).mockReturnValue(
      queryResult({ maEmailPreview: { ...PREVIEW.maEmailPreview, recipients: [] } }) as never,
    );
    const { unmount } = renderWithProviders(<EmailTab meeting={makeMeeting()} />);
    await user.click(screen.getByRole('button', { name: 'Preview' }));
    expect(await screen.findByText('To: nobody yet')).toBeInTheDocument();
    unmount();

    vi.mocked(useMaEmailPreviewQuery).mockReturnValue(
      queryResult(undefined, { loading: true }) as never,
    );
    const loading = renderWithProviders(<EmailTab meeting={makeMeeting()} />);
    await user.click(screen.getByRole('button', { name: 'Preview' }));
    expect(screen.queryByTitle('Email preview')).not.toBeInTheDocument();
    loading.unmount();

    const refetch = vi.fn().mockResolvedValue({});
    vi.mocked(useMaEmailPreviewQuery).mockReturnValue(
      queryResult(undefined, { error: new Error('No notes to send'), refetch }) as never,
    );
    renderWithProviders(<EmailTab meeting={makeMeeting()} />);
    await user.click(screen.getByRole('button', { name: 'Preview' }));
    expect(await screen.findByText('No notes to send')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalled();
  });

  it('shows the deliveries failing to load, with Retry', async () => {
    const refetch = vi.fn().mockResolvedValue({});
    vi.mocked(useMaEmailDeliveriesQuery).mockReturnValue(
      queryResult(undefined, { error: new Error('Deliveries down'), refetch }) as never,
    );
    renderWithProviders(<EmailTab meeting={makeMeeting()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalled();
  });

  it('shows the deliveries loading', () => {
    vi.mocked(useMaEmailDeliveriesQuery).mockReturnValue(
      queryResult(undefined, { loading: true }) as never,
    );
    renderWithProviders(<EmailTab meeting={makeMeeting()} />);
    expect(
      screen.queryByText('No summary email has been sent for this meeting.'),
    ).not.toBeInTheDocument();
  });

  it('says when no email has been sent yet', async () => {
    const refetch = vi.fn().mockResolvedValue({});
    vi.mocked(useMaEmailDeliveriesQuery).mockReturnValue(
      queryResult({ maEmailDeliveries: [] }, { refetch }) as never,
    );
    renderWithProviders(<EmailTab meeting={makeMeeting()} />);
    expect(
      screen.getByText('No summary email has been sent for this meeting.'),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Refresh table' }));
    expect(refetch).toHaveBeenCalled();
  });
});
