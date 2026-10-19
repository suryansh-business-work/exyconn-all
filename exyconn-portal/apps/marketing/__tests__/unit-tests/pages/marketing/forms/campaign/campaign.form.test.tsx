import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  GetCampaignDocument,
  PreviewCampaignContentDocument,
} from '@exyconn/shell/graphql/generated';
import { CampaignForm } from '../../../../../../src/pages/marketing/forms/campaign';
import type { CampaignRow } from '../../../../../../src/pages/marketing/forms/campaign/campaign.types';
import { renderWithProviders, useCurrentUrl } from '../../../../test-utils';
import { campaignRow } from '../../../../fixtures';
import { checksState, preview, studioOptions } from './studio.fixtures';

const gql = vi.hoisted(() => ({
  options: vi.fn(),
  save: vi.fn(),
  checks: vi.fn(),
  refetchChecks: vi.fn(),
}));
const apollo = vi.hoisted(() => ({ query: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCampaignStudioOptionsQuery: () => gql.options(),
  useSaveCampaignDraftMutation: () => [gql.save],
  useCampaignQualityChecksQuery: (options: unknown) => gql.checks(options),
}));
vi.mock('@apollo/client/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useApolloClient: () => apollo,
}));
vi.mock(
  '../../../../../../src/pages/marketing/forms/campaign/studio/StudioStepContent',
  () => import('./studio-content-stub'),
);

function Url() {
  return <output aria-label="Url">{useCurrentUrl()}</output>;
}

function renderForm(initial: CampaignRow | null = null, route = '/marketing/campaigns/new') {
  const onExit = vi.fn();
  renderWithProviders(
    <>
      <CampaignForm initial={initial} onExit={onExit} />
      <Url />
    </>,
    { route },
  );
  return onExit;
}

const output = (name: string) => screen.getByRole('status', { name });
const press = (name: string) => userEvent.click(screen.getByRole('button', { name }));
const stepTab = (name: RegExp) => screen.getByRole('tab', { name });

/** Answers the open confirmation with its button named `name`. */
async function answer(name: string) {
  const dialog = await screen.findByRole('dialog');
  await userEvent.click(within(dialog).getByRole('button', { name }));
}

describe('CampaignForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.options.mockReturnValue({
      data: { campaignStudioOptions: studioOptions() },
      loading: false,
    });
    gql.save.mockImplementation(({ variables }) =>
      Promise.resolve({
        data: {
          saveCampaignDraft: campaignRow({
            id: variables.id ?? 'campaign-new',
            name: variables.input.name,
          }),
        },
      }),
    );
    gql.refetchChecks.mockResolvedValue({});
    gql.checks.mockImplementation(({ skip }) => ({
      data: skip ? undefined : { campaignQualityChecks: checksState().report },
      loading: false,
      error: undefined,
      refetch: gql.refetchChecks,
    }));
    apollo.query.mockImplementation(({ query }) => {
      if (query === PreviewCampaignContentDocument) {
        return Promise.resolve({ data: { previewCampaignContent: preview() } });
      }
      return Promise.resolve({ data: { getCampaign: campaignRow({ id: 'campaign-1' }) } });
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts a new campaign on the setup step, sent from the verified address', async () => {
    renderForm();
    expect(screen.getByRole('heading', { name: 'New campaign' })).toBeInTheDocument();
    expect(output('Current step')).toHaveTextContent('setup');
    expect(stepTab(/Campaign setup/)).toHaveAttribute('aria-current', 'step');
    expect(stepTab(/Audience/)).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled();
    expect(screen.getByRole('form', { name: 'Campaign studio' })).toHaveAttribute('novalidate');
    await press('Fill setup');
    await press('Next');
    await waitFor(() => expect(output('Current step')).toHaveTextContent('audience'));
    expect(gql.save.mock.calls[0][0].variables.input.senderEmail).toBe('hello@exyconn.com');
  });

  it('keeps a step until its fields are valid, and saves before moving on', async () => {
    renderForm();
    await press('Next');
    await waitFor(() => expect(output('Errors')).toHaveTextContent('name,senderName,subject'));
    expect(output('Current step')).toHaveTextContent('setup');
    expect(gql.save).not.toHaveBeenCalled();

    await press('Fill setup');
    await press('Next');
    await waitFor(() => expect(output('Url')).toHaveTextContent('?step=audience'));
    expect(gql.save).toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Diwali offer' })).toBeInTheDocument();
    expect(output('Campaign id')).toHaveTextContent('campaign-new');

    await press('Next');
    await waitFor(() => expect(output('Errors')).toHaveTextContent('scheduledAudienceListId'));
    expect(output('Current step')).toHaveTextContent('audience');
    await press('Pick audience');
    await press('Next');
    await waitFor(() => expect(output('Current step')).toHaveTextContent('design'));
  });

  it('goes back without checking, and lets reached steps be jumped to', async () => {
    renderForm();
    await press('Fill setup');
    await press('Next');
    await waitFor(() => expect(output('Current step')).toHaveTextContent('audience'));
    await press('Back');
    await waitFor(() => expect(output('Current step')).toHaveTextContent('setup'));
    expect(stepTab(/Audience/)).toBeEnabled();
    expect(stepTab(/Email design/)).toBeDisabled();
    await userEvent.click(stepTab(/Audience/));
    await waitFor(() => expect(output('Current step')).toHaveTextContent('audience'));
  });

  it('opens a saved campaign on the step in the URL with every step reachable', () => {
    renderForm(campaignRow(), '/marketing/campaigns/campaign-1?step=test');
    expect(screen.getByRole('heading', { name: 'Diwali offer' })).toBeInTheDocument();
    expect(output('Current step')).toHaveTextContent('test');
    for (const tab of screen.getAllByRole('tab')) {
      expect(tab).toBeEnabled();
    }
  });

  it('opens an unknown step as setup', () => {
    renderForm(null, '/marketing/campaigns/new?step=nope');
    expect(output('Current step')).toHaveTextContent('setup');
  });

  it('has no Next on the last step', () => {
    renderForm(campaignRow(), '/x?step=review');
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
  });

  it('keeps a sender a saved campaign already has', async () => {
    renderForm(campaignRow({ senderEmail: 'promo@exyconn.com' }), '/x?step=review');
    await press('Pick audience');
    await press('Save draft');
    await waitFor(() => expect(gql.save).toHaveBeenCalled());
    expect(gql.save.mock.calls[0][0].variables.input.senderEmail).toBe('promo@exyconn.com');
  });

  it('shows why the studio options could not load', () => {
    gql.options.mockReturnValue({ data: undefined, loading: false, error: new Error('Denied') });
    renderForm();
    expect(screen.getByText('Denied')).toBeInTheDocument();
  });

  it('builds the preview only on the design, personalisation and test steps', async () => {
    renderForm(campaignRow(), '/x?step=setup');
    await new Promise((resolve) => globalThis.setTimeout(resolve, 600));
    expect(apollo.query).not.toHaveBeenCalled();
    expect(output('Preview')).toHaveTextContent('none');
    await userEvent.click(stepTab(/Personalization/));
    await waitFor(() => expect(output('Preview')).toHaveTextContent('Hi Asha'));
    expect(apollo.query).toHaveBeenCalledWith(
      expect.objectContaining({
        query: PreviewCampaignContentDocument,
        variables: {
          input: expect.objectContaining({
            campaignName: 'Diwali offer',
            subject: 'Festive savings',
            recordKind: null,
            recordId: null,
          }),
        },
      }),
    );
    await press('Preview as contact');
    await waitFor(() =>
      expect(apollo.query).toHaveBeenLastCalledWith(
        expect.objectContaining({
          variables: {
            input: expect.objectContaining({ recordKind: 'CONTACT', recordId: 'contact-1' }),
          },
        }),
      ),
    );
  });

  it('runs the quality checks only on the test and review steps of a saved draft', async () => {
    renderForm(campaignRow({ scheduledAudienceListId: 'audience-1' }), '/x?step=design');
    expect(gql.checks).toHaveBeenLastCalledWith(expect.objectContaining({ skip: true }));
    expect(output('Checks')).toHaveTextContent('none');
    await userEvent.click(stepTab(/Review & schedule/));
    await waitFor(() => expect(output('Checks')).toHaveTextContent('report'));
    expect(gql.checks).toHaveBeenLastCalledWith({
      variables: { id: 'campaign-1', audienceListId: 'audience-1' },
      skip: false,
      fetchPolicy: 'network-only',
    });
  });

  it('saves the draft on demand', async () => {
    renderForm();
    await press('Fill setup');
    await press('Save draft');
    await waitFor(() => expect(gql.save).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('All changes saved')).toBeInTheDocument());
  });

  it('refreshes the campaign and re-runs the checks after a send is queued', async () => {
    renderForm(campaignRow(), '/x?step=review');
    apollo.query.mockResolvedValueOnce({
      data: { getCampaign: campaignRow({ id: 'campaign-1', name: 'Refreshed' }) },
    });
    await press('Report queued');
    await waitFor(() => expect(gql.refetchChecks).toHaveBeenCalledTimes(1));
    expect(apollo.query).toHaveBeenCalledWith({
      query: GetCampaignDocument,
      variables: { id: 'campaign-1' },
      fetchPolicy: 'network-only',
    });
  });

  it('still re-runs the checks when the refresh brings no data', async () => {
    renderForm(campaignRow(), '/x?step=review');
    apollo.query.mockResolvedValueOnce({ data: undefined });
    await press('Report queued');
    await waitFor(() => expect(gql.refetchChecks).toHaveBeenCalledTimes(1));
  });

  it('says when the campaign could not be refreshed', async () => {
    renderForm(campaignRow(), '/x?step=review');
    apollo.query.mockRejectedValueOnce(new Error('Network down'));
    await press('Report queued');
    expect(await screen.findByText('Network down')).toBeInTheDocument();
    expect(gql.refetchChecks).not.toHaveBeenCalled();
  });

  it('refreshes nothing before the draft exists', async () => {
    renderForm(null, '/x?step=review');
    await press('Report queued');
    expect(apollo.query).not.toHaveBeenCalledWith(
      expect.objectContaining({ query: GetCampaignDocument }),
    );
  });

  it('leaves straight away once everything is saved', async () => {
    const onExit = renderForm(campaignRow());
    await press('Back to campaigns');
    await waitFor(() => expect(onExit).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('asks before leaving changes that could not be saved', async () => {
    gql.save.mockRejectedValue(new Error('Conflict'));
    const onExit = renderForm(campaignRow(), '/x?step=setup');
    await press('Pick audience');
    await press('Back to campaigns');
    expect(await screen.findByText('Leave without saving?')).toBeInTheDocument();
    await answer('Cancel');
    expect(onExit).not.toHaveBeenCalled();
    await userEvent.click(await screen.findByRole('button', { name: 'Back to campaigns' }));
    await answer('Leave');
    await waitFor(() => expect(onExit).toHaveBeenCalledTimes(1));
  });

  it('asks before leaving a new campaign that has no name to save under', async () => {
    const onExit = renderForm();
    await press('Back to campaigns');
    await answer('Leave');
    await waitFor(() => expect(onExit).toHaveBeenCalledTimes(1));
    expect(gql.save).not.toHaveBeenCalled();
  });
});
