import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UseFormReturn } from 'react-hook-form';
import { AudienceUpdateMode } from '@exyconn/shell/graphql/generated';
import { AudienceStep } from '../../../../../../../src/pages/marketing/forms/campaign/steps/AudienceStep';
import type { CampaignStudioValues } from '../../../../../../../src/pages/marketing/forms/campaign/campaign.types';
import { renderWithProviders } from '../../../../../test-utils';
import { chooseOption, optionsOf } from '../../../../../form-helpers';
import { audienceRow } from '../../../../../fixtures';
import { StudioFormHarness } from '../form-harness';
import { checksState } from '../studio.fixtures';

const gql = vi.hoisted(() => ({ lists: vi.fn(), counts: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListAudienceListsQuery: () => gql.lists(),
  useAudienceResolutionCountsQuery: (options: unknown) => gql.counts(options),
}));

const COUNTS = checksState().report?.counts;

const resolution = (eligible: number) => ({
  data: {
    audienceResolution: {
      resolvedAt: '2026-10-20T04:30:00.000Z',
      counts: { ...COUNTS, eligible },
    },
  },
  loading: false,
  error: undefined,
  refetch: gql.refetch,
});

function renderStep(values: Partial<CampaignStudioValues> = {}) {
  let form: UseFormReturn<CampaignStudioValues> | undefined;
  renderWithProviders(
    <StudioFormHarness
      values={values}
      onForm={(value) => {
        form = value;
      }}
    >
      <AudienceStep />
    </StudioFormHarness>,
  );
  return () => form as UseFormReturn<CampaignStudioValues>;
}

describe('AudienceStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.lists.mockReturnValue({
      data: {
        listAudienceLists: [
          audienceRow({ id: 'a1', name: 'Cafés', updateMode: AudienceUpdateMode.Dynamic }),
          audienceRow({ id: 'a2', name: 'VIPs', updateMode: AudienceUpdateMode.Fixed }),
        ],
      },
      loading: false,
    });
    gql.counts.mockReturnValue(resolution(42));
  });

  it('offers the saved audiences, saying which are live', async () => {
    renderStep();
    expect(await optionsOf('Audience')).toEqual(['Cafés · Live dynamic', 'VIPs · Fixed']);
    expect(screen.getByRole('link', { name: 'Create or edit audiences' })).toHaveAttribute(
      'href',
      '/marketing/audiences',
    );
    expect(gql.counts).not.toHaveBeenCalled();
  });

  it('says when there are no audiences yet, but not while they load', () => {
    gql.lists.mockReturnValue({ data: { listAudienceLists: [] }, loading: false });
    renderStep();
    expect(screen.getByText('No audiences yet — create one first.')).toBeInTheDocument();
  });

  it('does not claim there are no audiences while loading', () => {
    gql.lists.mockReturnValue({ data: undefined, loading: true });
    renderStep();
    expect(screen.queryByText('No audiences yet — create one first.')).not.toBeInTheDocument();
  });

  it('shows the live counts of the chosen audience with its category applied', async () => {
    const form = renderStep({ preferenceCategoryId: 'cat-1' });
    await chooseOption('Audience', 'Cafés · Live dynamic');
    expect(form().getValues('scheduledAudienceListId')).toBe('a1');
    expect(gql.counts).toHaveBeenLastCalledWith({
      variables: { id: 'a1', categoryId: 'cat-1' },
      fetchPolicy: 'network-only',
    });
    expect(screen.getByText('Final eligible recipients')).toBeInTheDocument();
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(/^42 unique email address\(es\) are eligible right now/);
    expect(status.closest('.MuiAlert-root')).toHaveClass('MuiAlert-colorInfo');
  });

  it('warns when nobody is eligible, counting with no category', () => {
    gql.counts.mockReturnValue(resolution(0));
    renderStep({ scheduledAudienceListId: 'a2' });
    expect(gql.counts).toHaveBeenCalledWith({
      variables: { id: 'a2', categoryId: null },
      fetchPolicy: 'network-only',
    });
    expect(screen.getByRole('status').closest('.MuiAlert-root')).toHaveClass(
      'MuiAlert-colorWarning',
    );
  });

  it('shows the figures dimmed and no verdict while the first count runs', () => {
    gql.counts.mockReturnValue({ data: undefined, loading: true, refetch: gql.refetch });
    renderStep({ scheduledAudienceListId: 'a1' });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows a failed count and counts again on Retry', async () => {
    gql.counts.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('Audience not found'),
      refetch: gql.refetch,
    });
    renderStep({ scheduledAudienceListId: 'a1' });
    expect(screen.getByRole('alert')).toHaveTextContent('Audience not found');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('requires an audience', async () => {
    const form = renderStep();
    await act(() => form().trigger('scheduledAudienceListId'));
    expect(screen.getByText('Choose who receives this campaign')).toBeInTheDocument();
  });
});
