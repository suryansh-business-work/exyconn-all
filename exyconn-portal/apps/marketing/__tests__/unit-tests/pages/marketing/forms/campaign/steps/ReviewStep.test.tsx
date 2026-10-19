import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CampaignSendState } from '@exyconn/shell/graphql/generated';
import { ReviewStep } from '../../../../../../../src/pages/marketing/forms/campaign/steps/ReviewStep';
import type {
  CampaignRow,
  CampaignStudioValues,
} from '../../../../../../../src/pages/marketing/forms/campaign/campaign.types';
import { renderWithProviders } from '../../../../../test-utils';
import { audienceRow, campaignRow } from '../../../../../fixtures';
import { StudioFormHarness } from '../form-harness';
import { checksState, studioOptions, type ChecksState } from '../studio.fixtures';

const gql = vi.hoisted(() => ({ lists: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListAudienceListsQuery: () => gql.lists(),
}));
vi.mock(
  '../../../../../../../src/pages/marketing/forms/campaign-schedule',
  () => import('../form-stubs'),
);
vi.mock(
  '../../../../../../../src/pages/marketing/CampaignDeliveryPanel',
  () => import('../form-stubs'),
);

const VALUES: Partial<CampaignStudioValues> = {
  name: 'Diwali offer',
  senderName: 'Exyconn',
  senderEmail: 'hello@exyconn.com',
  replyTo: 'sales@exyconn.com',
  subject: 'Festive savings',
  preheader: 'Up to 40% off',
  scheduledAudienceListId: 'a1',
  preferenceCategoryId: 'cat-1',
};

function renderStep({
  campaign = campaignRow(),
  checks = checksState(),
  values = VALUES,
}: {
  campaign?: CampaignRow | null;
  checks?: ChecksState;
  values?: Partial<CampaignStudioValues>;
} = {}) {
  const save = vi.fn().mockResolvedValue(true);
  const onQueued = vi.fn();
  renderWithProviders(
    <StudioFormHarness values={values}>
      <ReviewStep
        campaign={campaign}
        options={studioOptions()}
        checks={checks}
        save={save}
        onQueued={onQueued}
      />
    </StudioFormHarness>,
  );
  return { save, onQueued };
}

/** The value shown under a fact's label. */
const fact = (label: string) => screen.getByText(label).nextElementSibling?.textContent;

describe('ReviewStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.lists.mockReturnValue({
      data: { listAudienceLists: [audienceRow({ id: 'a1', name: 'Cafés' })] },
    });
  });

  it('waits for a saved campaign before it can be reviewed', () => {
    renderStep({ campaign: null });
    expect(
      screen.getByText('Name the campaign so it can be saved; then it can be reviewed.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Schedule form' })).not.toBeInTheDocument();
  });

  it('sums up the whole send', () => {
    renderStep();
    expect(fact('Campaign')).toBe('Diwali offer');
    expect(fact('From')).toBe('Exyconn <hello@exyconn.com>');
    expect(fact('Reply-to')).toBe('sales@exyconn.com');
    expect(fact('Subject')).toBe('Festive savings');
    expect(fact('Preview text')).toBe('Up to 40% off');
    expect(fact('Audience')).toBe('Cafés');
    expect(fact('Preference category')).toBe('Offers');
  });

  it('marks what is not set', () => {
    gql.lists.mockReturnValue({ data: undefined });
    renderStep({ values: { ...VALUES, replyTo: '', preheader: '', preferenceCategoryId: '' } });
    expect(fact('Reply-to')).toBe('—');
    expect(fact('Preview text')).toBe('—');
    expect(fact('Audience')).toBe('—');
    expect(fact('Preference category')).toBe('General marketing');
  });

  it('counts unique addresses and hands the schedule form what it needs', async () => {
    const { save, onQueued } = renderStep();
    expect(screen.getAllByRole('status')[0]).toHaveTextContent(
      'This campaign will be sent to 3 unique email address(es)',
    );
    expect(screen.getByRole('region', { name: 'Schedule form' })).toHaveTextContent(
      '{"campaignId":"campaign-1","audienceListId":"a1","eligible":3,"canSend":true}',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Queue send' }));
    expect(save).toHaveBeenCalledTimes(1);
    expect(onQueued).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('region', { name: 'Delivery panel' })).not.toBeInTheDocument();
  });

  it('warns about zero recipients and blocks the send until checks have run', () => {
    renderStep({ checks: checksState({ report: null }) });
    const verdict = screen.getByText(/This campaign will be sent to 0 unique/);
    expect(verdict.closest('.MuiAlert-root')).toHaveClass('MuiAlert-colorWarning');
    expect(screen.getByRole('region', { name: 'Schedule form' })).toHaveTextContent(
      '"eligible":0,"canSend":false',
    );
  });

  it('runs the checks again from the panel', async () => {
    const run = vi.fn();
    renderStep({ checks: checksState({ run }) });
    await userEvent.click(screen.getByRole('button', { name: 'Run checks' }));
    expect(run).toHaveBeenCalledTimes(1);
  });

  it.each([CampaignSendState.Queued, CampaignSendState.Sending])(
    'explains that a %s campaign ignores draft edits and shows its delivery',
    async (sendState) => {
      const { onQueued } = renderStep({ campaign: campaignRow({ sendState }) });
      expect(screen.getByText(/This campaign is queued or sending/)).toBeInTheDocument();
      expect(screen.queryByRole('region', { name: 'Schedule form' })).not.toBeInTheDocument();
      expect(screen.getByRole('region', { name: 'Delivery panel' })).toHaveTextContent(
        'campaign-1',
      );
      await userEvent.click(screen.getByRole('button', { name: 'Delivery changed' }));
      expect(onQueued).toHaveBeenCalledTimes(1);
    },
  );

  it.each([CampaignSendState.Sent, CampaignSendState.Cancelled, CampaignSendState.Failed])(
    'lets a %s campaign be sent again and shows how the last send went',
    (sendState) => {
      renderStep({ campaign: campaignRow({ sendState }) });
      expect(screen.getByRole('region', { name: 'Schedule form' })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: 'Delivery panel' })).toBeInTheDocument();
      expect(screen.getByText('Delivery')).toBeInTheDocument();
    },
  );
});
