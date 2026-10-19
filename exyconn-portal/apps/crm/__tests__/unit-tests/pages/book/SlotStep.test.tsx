import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SlotStep } from '../../../../src/pages/book/SlotStep';
import { renderWithProviders } from '../../test-utils';

const gql = vi.hoisted(() => ({ slots: vi.fn(), slotsArgs: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  usePublicMeetingSlotsQuery: (options: unknown) => {
    gql.slotsArgs(options);
    return gql.slots();
  },
}));

const at = { org: 'acme', page: 'team' };
const october = [
  '2026-10-14T09:00:00.000Z',
  '2026-10-14T10:00:00.000Z',
  '2026-10-20T12:00:00.000Z',
];

function renderStep() {
  const onPick = vi.fn();
  const onZone = vi.fn();
  const view = renderWithProviders(
    <SlotStep at={at} slug="intro-call" zone="UTC" onZone={onZone} onPick={onPick} />,
  );
  return { onPick, onZone, view };
}

function day(n: string) {
  return screen.getByRole('gridcell', { name: n });
}

function freeTimes() {
  return within(screen.getByRole('group', { name: 'Free times' }));
}

describe('SlotStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Only the clock is fixed: "today" is Monday 5 October 2026, so the calendar opens on October.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 5, 10, 0));
    gql.slots.mockReturnValue({ data: { publicMeetingSlots: october }, loading: false });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('asks for this month’s free times, fresh from the server', () => {
    renderStep();

    expect(gql.slotsArgs).toHaveBeenCalledWith({
      variables: {
        ...at,
        slug: 'intro-call',
        from: new Date(2026, 9, 1).toISOString(),
        to: new Date(2026, 9, 31, 23, 59, 59, 999).toISOString(),
      },
      fetchPolicy: 'network-only',
    });
  });

  it('lets only the days with free times be picked', () => {
    renderStep();

    expect(day('14')).not.toBeDisabled();
    expect(day('20')).not.toBeDisabled();
    expect(day('15')).toBeDisabled();
    expect(screen.queryByRole('group', { name: 'Free times' })).not.toBeInTheDocument();
  });

  it('lists a picked day’s times in the zone and passes on the one chosen', async () => {
    const { onPick } = renderStep();

    await userEvent.click(day('14'));
    expect(screen.getByText('Wednesday, October 14')).toBeInTheDocument();
    expect(freeTimes().getAllByRole('button').map((b) => b.textContent)).toEqual([
      '09:00 AM',
      '10:00 AM',
    ]);

    await userEvent.click(freeTimes().getByRole('button', { name: '10:00 AM' }));
    await userEvent.click(freeTimes().getByRole('button', { name: 'Next' }));

    expect(onPick).toHaveBeenCalledWith('2026-10-14T10:00:00.000Z');
  });

  it('forgets the chosen time when another day is picked', async () => {
    renderStep();
    await userEvent.click(day('14'));
    await userEvent.click(freeTimes().getByRole('button', { name: '09:00 AM' }));

    await userEvent.click(day('20'));

    expect(screen.getByText('Tuesday, October 20')).toBeInTheDocument();
    expect(freeTimes().queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
  });

  it('says a picked day has no times left once a reload takes them away', async () => {
    const { view } = renderStep();
    await userEvent.click(day('14'));

    gql.slots.mockReturnValue({ data: { publicMeetingSlots: [] }, loading: false });
    view.rerender(
      <SlotStep at={at} slug="intro-call" zone="UTC" onZone={vi.fn()} onPick={vi.fn()} />,
    );

    expect(screen.getByText('No free times that day.')).toBeInTheDocument();
  });

  it('loads the next month and clears the picked day when the month changes', async () => {
    renderStep();
    await userEvent.click(day('14'));

    await userEvent.click(screen.getByRole('button', { name: 'Next month' }));

    expect(gql.slotsArgs).toHaveBeenLastCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({ from: new Date(2026, 10, 1).toISOString() }),
      }),
    );
    expect(screen.queryByRole('group', { name: 'Free times' })).not.toBeInTheDocument();
  });

  it('shows a spinner while the month loads', () => {
    gql.slots.mockReturnValue({ data: undefined, loading: true });
    renderStep();

    expect(screen.getByText('Loading free times…')).toBeInTheDocument();
  });

  it('says why the free times could not load', () => {
    gql.slots.mockReturnValue({ data: undefined, loading: false, error: new Error('down') });
    renderStep();

    expect(screen.getByText('down')).toBeInTheDocument();
  });
});
