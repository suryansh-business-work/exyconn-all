import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useFormatters } from '@exyconn/i18n';
import type { AudienceListInput } from '@exyconn/shell/graphql/generated';
import { AudienceLivePreview } from '../../../../../../src/pages/audiences/forms/audience-list/AudienceLivePreview';
import type { AudiencePreviewState } from '../../../../../../src/pages/audiences/forms/audience-list/useAudiencePreview';
import {
  toFormValues,
  toInput,
} from '../../../../../../src/pages/audiences/forms/audience-list/audience-list.types';
import { renderHookWithProviders, renderWithProviders } from '../../../../test-utils';
import { audienceCounts } from '../../audience.fixtures';

const preview = vi.hoisted(() => ({ state: vi.fn(), retry: vi.fn() }));

vi.mock('../../../../../../src/pages/audiences/forms/audience-list/useAudiencePreview', () => ({
  useAudiencePreview: (input: unknown) => preview.state(input),
}));

vi.mock('../../../../../../src/pages/audiences/AudienceRecipientsGrid', () => ({
  AudienceRecipientsGrid: ({ target }: Readonly<{ target: unknown }>) => (
    <p>{`Recipients of ${JSON.stringify(target)}`}</p>
  ),
}));

const INPUT: AudienceListInput = toInput({ ...toFormValues(null), name: 'Cafés' });
const RESOLVED_AT = '2026-10-20T09:00:00.000Z';
const EXPLAINER =
  'Unique email addresses eligible for the campaign after filtering, deduplication and exclusions.';

function state(overrides: Partial<AudiencePreviewState> = {}): AudiencePreviewState {
  return {
    counts: audienceCounts(),
    resolvedAt: RESOLVED_AT,
    updating: false,
    error: null,
    retry: preview.retry,
    ...overrides,
  };
}

const summary = () => screen.getAllByRole('status').find((el) => el.getAttribute('aria-live'));

describe('AudienceLivePreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    preview.state.mockReturnValue(state());
  });

  it('asks for the counts of exactly the settings it is given', () => {
    renderWithProviders(<AudienceLivePreview input={INPUT} />);

    expect(preview.state).toHaveBeenCalledWith(INPUT);
  });

  it('pins the final eligible figure with when it was refreshed', () => {
    const { result } = renderHookWithProviders(() => useFormatters());
    renderWithProviders(<AudienceLivePreview input={INPUT} />);

    const pinned = summary();
    expect(pinned).toHaveTextContent('Final eligible recipients');
    expect(pinned).toHaveTextContent('1,430');
    expect(pinned).toHaveTextContent(
      `Last refreshed ${result.current.formatDateTime(RESOLVED_AT)}`,
    );
    expect(pinned?.querySelector('.MuiCircularProgress-root')).toBeNull();
    expect(screen.getByRole('region', { name: 'Live audience preview' })).toBeInTheDocument();
    expect(screen.getByText('Contacts').previousSibling).toHaveTextContent('120');
  });

  it('shows a dash and says it is updating before the first figures', () => {
    preview.state.mockReturnValue(state({ counts: null, resolvedAt: null, updating: true }));
    renderWithProviders(<AudienceLivePreview input={INPUT} />);

    const pinned = summary();
    expect(pinned).toHaveTextContent('—');
    expect(pinned).toHaveTextContent('Updating counts…');
    expect(pinned?.querySelector('.MuiCircularProgress-root')).not.toBeNull();
  });

  it('explains the figure when there is no refresh time to show', () => {
    preview.state.mockReturnValue(state({ counts: null, resolvedAt: null }));
    renderWithProviders(<AudienceLivePreview input={INPUT} />);

    expect(summary()).toHaveTextContent(EXPLAINER);
  });

  it('shows the error with a retry, keeping the last figures', async () => {
    preview.state.mockReturnValue(state({ error: 'The counts could not be updated.' }));
    renderWithProviders(<AudienceLivePreview input={INPUT} />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('The counts could not be updated.');
    await userEvent.click(within(alert).getByRole('button', { name: 'Retry' }));

    expect(preview.retry).toHaveBeenCalledTimes(1);
    expect(summary()).toHaveTextContent('1,430');
  });

  it('opens the recipients of the unsaved settings and closes them again', async () => {
    renderWithProviders(<AudienceLivePreview input={INPUT} />);
    expect(screen.queryByText(/Recipients of/)).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Preview recipients' }));

    expect(await screen.findByRole('heading', { name: 'Recipients' })).toBeInTheDocument();
    expect(
      screen.getByText(`Recipients of ${JSON.stringify({ draft: INPUT })}`),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Recipients' })).toBeNull());
    expect(screen.queryByText(/Recipients of/)).toBeNull();
  });
});
