import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useTrackView } from '../../../../src/pages/book/useTrackView';
import { browserZone } from '../../../../src/pages/book/useBookingTime';
import type { BookingAddress } from '../../../../src/pages/book/useBookingAddress';
import { createWrapper } from '../../test-utils';

const gql = vi.hoisted(() => ({ track: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useTrackMeetingViewMutation: () => [gql.track],
}));

const at: BookingAddress = { org: 'acme', page: 'team' };

interface Props {
  slug: string;
  ready: boolean;
}

function renderTracker(initial: Props) {
  return renderHook(({ slug, ready }: Props) => useTrackView(at, slug, ready), {
    initialProps: initial,
    wrapper: createWrapper(),
  });
}

describe('useTrackView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.track.mockResolvedValue({ data: { trackMeetingView: true } });
  });

  it('waits until the page has loaded before counting', () => {
    const { rerender } = renderTracker({ slug: 'intro-call', ready: false });
    expect(gql.track).not.toHaveBeenCalled();

    rerender({ slug: 'intro-call', ready: true });

    expect(gql.track).toHaveBeenCalledWith({
      variables: { org: 'acme', page: 'team', slug: 'intro-call', timezone: browserZone() },
    });
  });

  it('counts a page once however often it renders, and again for another page', () => {
    const { rerender } = renderTracker({ slug: 'intro-call', ready: true });
    rerender({ slug: 'intro-call', ready: true });
    expect(gql.track).toHaveBeenCalledTimes(1);

    rerender({ slug: '', ready: true });

    expect(gql.track).toHaveBeenCalledTimes(2);
    expect(gql.track).toHaveBeenLastCalledWith({
      variables: expect.objectContaining({ slug: '' }),
    });
  });

  it('logs a count that failed without bothering the visitor', async () => {
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    gql.track.mockRejectedValueOnce(new Error('offline'));

    renderTracker({ slug: 'intro-call', ready: true });

    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        'crm: counting a booking page visit failed',
        new Error('offline'),
      ),
    );
  });
});
