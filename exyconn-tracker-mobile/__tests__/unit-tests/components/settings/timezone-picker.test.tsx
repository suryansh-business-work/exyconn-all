import { fireEvent, screen, waitFor } from '@testing-library/react';
import { formatTimeOfDay, offsetLabel } from '@exyconn/tracker-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TimezonePicker } from '../../../../src/components/settings/TimezonePicker';
import type { TimezoneList } from '../../../../src/hooks/useTimezoneList';
import { renderWithProviders } from '../../test-utils';

const mocks = vi.hoisted(() => ({
  setTimezone: vi.fn((_zone: string) => Promise.resolve()),
  list: vi.fn(),
}));

vi.mock('../../../../src/tracker/instance', () => ({
  tracker: { setTimezone: mocks.setTimezone },
}));
vi.mock('../../../../src/hooks/useTimezoneList', () => ({ useTimezoneList: mocks.list }));

const ZONE = 'Asia/Kolkata';
const NOW = '2026-02-03T10:42:00.000Z';
const FIELD = `Timezone: ${ZONE}`;
const SAVE_FAILED = 'Your timezone could not be saved. Check your connection and try again.';
const LIST_FAILED = 'The list of timezones could not be loaded. Tap the field to try again.';
const reload = vi.fn();

function list(overrides: Partial<TimezoneList> = {}): TimezoneList {
  return { zones: ['Asia/Kolkata', 'Europe/London'], failed: false, reload, ...overrides };
}

function openSheet(): void {
  fireEvent.click(screen.getByRole('button', { name: FIELD }));
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(NOW));
  mocks.list.mockReturnValue(list());
});

describe('TimezonePicker', () => {
  it('shows the zone in force, its offset and the time there now', () => {
    renderWithProviders(<TimezonePicker timezone={ZONE} />);

    expect(screen.getByText(ZONE)).toBeInTheDocument();
    expect(
      screen.getByText(
        `Every date and time in this app is shown in this zone (${offsetLabel(ZONE)}).`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`It is ${formatTimeOfDay(NOW, ZONE)} there right now.`),
    ).toBeInTheDocument();
  });

  it('cannot be opened while the list of zones is still loading', () => {
    mocks.list.mockReturnValue(list({ zones: null }));
    renderWithProviders(<TimezonePicker timezone={ZONE} />);

    const field = screen.getByRole('button', { name: FIELD });
    expect(field).toHaveAttribute('aria-disabled', 'true');
    expect(field).toHaveAttribute('aria-busy', 'true');
    fireEvent.click(field);
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  it('saves a newly picked zone to the portal and closes the list', async () => {
    renderWithProviders(<TimezonePicker timezone={ZONE} />);
    openSheet();

    fireEvent.click(screen.getByRole('radio', { name: 'Europe/London' }));

    expect(mocks.setTimezone).toHaveBeenCalledWith('Europe/London');
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: FIELD })).not.toHaveAttribute('aria-disabled'),
    );
  });

  it('marks the zone in force and saves nothing when it is picked again', () => {
    renderWithProviders(<TimezonePicker timezone={ZONE} />);
    openSheet();

    const current = screen.getByRole('radio', { name: ZONE });
    expect(current).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(current);

    expect(mocks.setTimezone).not.toHaveBeenCalled();
  });

  it('stays busy while the new zone is being saved', async () => {
    let finish: () => void = () => undefined;
    mocks.setTimezone.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
    );
    renderWithProviders(<TimezonePicker timezone={ZONE} />);
    openSheet();

    fireEvent.click(screen.getByRole('radio', { name: 'Europe/London' }));
    const field = screen.getByRole('button', { name: FIELD });
    await waitFor(() => expect(field).toHaveAttribute('aria-busy', 'true'));

    finish();
    await waitFor(() => expect(field).toHaveAttribute('aria-busy', 'false'));
  });

  it('says the zone could not be saved, and logs why', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const cause = new Error('Offline');
    mocks.setTimezone.mockRejectedValueOnce(cause);
    renderWithProviders(<TimezonePicker timezone={ZONE} />);
    openSheet();

    fireEvent.click(screen.getByRole('radio', { name: 'Europe/London' }));

    expect(await screen.findByText(SAVE_FAILED)).toBeInTheDocument();
    expect(error).toHaveBeenCalledWith('Failed to save the timezone', cause);
  });

  it('asks for the list again, instead of opening an empty one, when it failed to load', () => {
    mocks.list.mockReturnValue(list({ zones: null, failed: true }));
    renderWithProviders(<TimezonePicker timezone={ZONE} />);

    expect(screen.getByText(LIST_FAILED)).toBeInTheDocument();
    openSheet();

    expect(reload).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  it('closes the list without saving', () => {
    renderWithProviders(<TimezonePicker timezone={ZONE} />);
    openSheet();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(mocks.setTimezone).not.toHaveBeenCalled();
  });
});
