import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DEFAULT_FORMAT_SETTINGS, formatDateTime } from '@exyconn/i18n';
import { CampaignScheduleForm } from '../../../../../../src/pages/marketing/forms/campaign-schedule';
import { renderWithProviders } from '../../../../test-utils';
import { fill, press } from '../../../../form-helpers';

const gql = vi.hoisted(() => ({ queue: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useQueueCampaignSendMutation: () => [gql.queue],
}));
vi.mock('@exyconn/shell/components/form/rhf', async (importOriginal) => {
  const stubs = await import('../../../../rhf-stubs');
  return {
    ...(await importOriginal<typeof import('@exyconn/shell/components/form/rhf')>()),
    RhfDateTimePicker: stubs.RhfValueStub,
  };
});

const FUTURE = '2099-03-14T09:30:00.000Z';

function renderSchedule(canSend = true, beforeQueue = vi.fn().mockResolvedValue(undefined)) {
  const onQueued = vi.fn();
  renderWithProviders(
    <CampaignScheduleForm
      campaignId="campaign-7"
      audienceListId="audience-3"
      eligible={1200}
      canSend={canSend}
      beforeQueue={beforeQueue}
      onQueued={onQueued}
    />,
  );
  return { beforeQueue, onQueued };
}

async function chooseLater() {
  await userEvent.click(screen.getByRole('radio', { name: /^Schedule/ }));
}

describe('CampaignScheduleForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.queue.mockResolvedValue({ data: { queueCampaignSend: true } });
  });

  it('starts on Send now, without a time to pick', () => {
    renderSchedule();

    expect(screen.getByRole('radio', { name: /^Send now/ })).toBeChecked();
    expect(screen.queryByLabelText('Send at')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send campaign' })).toBeInTheDocument();
    expect(screen.getByText('Starts within a minute, in small batches.')).toBeInTheDocument();
  });

  it('asks for a time and relabels the button when scheduling', async () => {
    renderSchedule();

    await chooseLater();

    expect(screen.getByLabelText('Send at')).toBeInTheDocument();
    expect(
      screen.getByText('In your timezone. The email content is frozen when you schedule.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Schedule campaign' })).toBeInTheDocument();
  });

  it('refuses to schedule without a time', async () => {
    renderSchedule();
    await chooseLater();

    await press('Schedule campaign');

    expect(await screen.findByText('Choose when to send')).toBeInTheDocument();
    expect(gql.queue).not.toHaveBeenCalled();
  });

  it('refuses a time in the past', async () => {
    renderSchedule();
    await chooseLater();
    fill('Send at', '2020-01-01T09:00:00.000Z');

    await press('Schedule campaign');

    expect(await screen.findByText('Choose a time in the future')).toBeInTheDocument();
    expect(gql.queue).not.toHaveBeenCalled();
  });

  it('confirms the exact count, saves the draft, then queues it now', async () => {
    const { beforeQueue, onQueued } = renderSchedule();

    await press('Send campaign');

    expect(await screen.findByText('Send this campaign now?')).toBeInTheDocument();
    expect(
      screen.getByText(
        'It will go to 1,200 unique email address(es) now. Unsubscribes and opt-outs are checked again as it sends.',
      ),
    ).toBeInTheDocument();
    await press('Send now');

    expect(await screen.findByText('Campaign is sending')).toBeInTheDocument();
    expect(gql.queue).toHaveBeenCalledWith({
      variables: { id: 'campaign-7', audienceListId: 'audience-3', scheduledAt: null },
    });
    expect(beforeQueue.mock.invocationCallOrder[0]).toBeLessThan(
      gql.queue.mock.invocationCallOrder[0],
    );
    expect(onQueued).toHaveBeenCalledTimes(1);
  });

  it('schedules for the chosen time, naming it in the confirmation', async () => {
    const { onQueued } = renderSchedule();
    await chooseLater();
    fill('Send at', FUTURE);

    await press('Schedule campaign');

    expect(await screen.findByText('Schedule this campaign?')).toBeInTheDocument();
    const when = formatDateTime(FUTURE, DEFAULT_FORMAT_SETTINGS);
    expect(
      screen.getByText(
        `It will go to 1,200 unique email address(es) on ${when}. Unsubscribes and opt-outs are checked again as it sends.`,
      ),
    ).toBeInTheDocument();
    await press('Schedule');

    expect(await screen.findByText('Campaign scheduled')).toBeInTheDocument();
    expect(gql.queue).toHaveBeenCalledWith({
      variables: { id: 'campaign-7', audienceListId: 'audience-3', scheduledAt: FUTURE },
    });
    expect(onQueued).toHaveBeenCalledTimes(1);
  });

  it('does nothing when the confirmation is declined', async () => {
    const { beforeQueue, onQueued } = renderSchedule();

    await press('Send campaign');
    await screen.findByText('Send this campaign now?');
    await press('Cancel');

    await waitFor(() =>
      expect(screen.queryByText('Send this campaign now?')).not.toBeInTheDocument(),
    );
    expect(beforeQueue).not.toHaveBeenCalled();
    expect(gql.queue).not.toHaveBeenCalled();
    expect(onQueued).not.toHaveBeenCalled();
  });

  it('warns and refuses while a check is failing', async () => {
    const { beforeQueue } = renderSchedule(false);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Fix the problems in the checks before sending.',
    );
    await press('Send campaign');

    await waitFor(() =>
      expect(screen.getAllByText('Fix the problems in the checks before sending.')).toHaveLength(2),
    );
    expect(screen.queryByText('Send this campaign now?')).not.toBeInTheDocument();
    expect(beforeQueue).not.toHaveBeenCalled();
    expect(gql.queue).not.toHaveBeenCalled();
  });

  it('reports why the draft could not be saved, and does not queue', async () => {
    const { onQueued } = renderSchedule(
      true,
      vi.fn().mockRejectedValue(new Error('Subject is required')),
    );

    await press('Send campaign');
    await press('Send now');

    expect(await screen.findByText('Subject is required')).toBeInTheDocument();
    expect(gql.queue).not.toHaveBeenCalled();
    expect(onQueued).not.toHaveBeenCalled();
  });

  it('falls back to a plain message when queueing fails without one', async () => {
    gql.queue.mockRejectedValue('boom');
    const { onQueued } = renderSchedule();

    await press('Send campaign');
    await press('Send now');

    expect(await screen.findByText('The campaign could not be queued')).toBeInTheDocument();
    expect(onQueued).not.toHaveBeenCalled();
  });

  it('goes back to Send now on Cancel', async () => {
    renderSchedule();
    await chooseLater();

    await press('Cancel');

    expect(screen.getByRole('radio', { name: /^Send now/ })).toBeChecked();
    expect(screen.queryByLabelText('Send at')).not.toBeInTheDocument();
  });
});
