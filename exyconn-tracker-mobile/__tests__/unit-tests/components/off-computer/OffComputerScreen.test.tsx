import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import type { TrackerProject } from '@exyconn/tracker-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OffComputerScreen } from '../../../../src/components/off-computer/OffComputerScreen';
import { useManualEntries } from '../../../../src/hooks/useManualEntries';
import { tracker } from '../../../../src/tracker/instance';
import { renderWithProviders } from '../../test-utils';
import { manualEntry, queryByA11yLabel } from '../state';

interface FormProps {
  projects: readonly TrackerProject[];
  timezone: string;
  onCancel: () => void;
  onDone: () => void;
}

vi.mock('../../../../src/hooks/useManualEntries', () => ({ useManualEntries: vi.fn() }));
vi.mock('../../../../src/tracker/instance', () => ({
  tracker: { withdrawManualEntry: vi.fn() },
}));
vi.mock('../../../../src/forms/manual-entry', () => ({
  ManualEntryForm: ({ projects, timezone, onCancel, onDone }: Readonly<FormProps>) => (
    <div data-testid="manual-entry-form" data-projects={projects.length} data-zone={timezone}>
      <button type="button" onClick={onCancel}>
        Cancel claim
      </button>
      <button type="button" onClick={onDone}>
        Finish claim
      </button>
    </div>
  ),
}));

const PROJECTS: TrackerProject[] = [{ id: 'p1', name: 'Global Project', key: 'GLB' }];
const reload = vi.fn();

function entries(overrides: Partial<ReturnType<typeof useManualEntries>> = {}) {
  vi.mocked(useManualEntries).mockReturnValue({
    entries: [manualEntry()],
    loading: false,
    error: null,
    reload,
    ...overrides,
  });
}

function renderScreen() {
  renderWithProviders(<OffComputerScreen projects={PROJECTS} timezone="Asia/Kolkata" />);
}

function withdrawAndConfirm() {
  fireEvent.click(screen.getByRole('button', { name: 'Withdraw' }));
  fireEvent.click(within(screen.getByTestId('rn-modal')).getByRole('button', { name: 'Withdraw' }));
}

beforeEach(() => {
  entries();
  vi.mocked(tracker.withdrawManualEntry).mockResolvedValue(undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

describe('OffComputerScreen', () => {
  it('spins on the first load, with nothing to list yet', () => {
    entries({ entries: [], loading: true });
    renderScreen();
    expect(queryByA11yLabel('Loading your claims')).not.toBeNull();
    expect(screen.queryByText(/You have not claimed/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Refresh' })).toHaveAttribute('aria-busy', 'false');
  });

  it('lists the claims and refreshes them on a pull', () => {
    renderScreen();
    expect(
      screen.getByText('Hours the tracker could not measure, and where each one stands.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Client visit')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('keeps the list on screen while a re-read is in flight', () => {
    entries({ loading: true });
    renderScreen();
    expect(screen.getByText('Client visit')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh' })).toHaveAttribute('aria-busy', 'true');
  });

  it('says when the claims could not be read', () => {
    entries({
      entries: [],
      error: 'Could not load your claims. Check your connection and try again.',
    });
    renderScreen();
    expect(
      screen.getByText('Could not load your claims. Check your connection and try again.'),
    ).toBeInTheDocument();
  });

  it('swaps the list for the claim form, and back on cancel', () => {
    renderScreen();
    fireEvent.click(screen.getByRole('button', { name: 'Claim time' }));
    expect(screen.getByText('Claim off-computer time')).toBeInTheDocument();
    const form = screen.getByTestId('manual-entry-form');
    expect(form.dataset.projects).toBe('1');
    expect(form.dataset.zone).toBe('Asia/Kolkata');
    expect(screen.queryByText('Client visit')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel claim' }));
    expect(screen.getByText('Client visit')).toBeInTheDocument();
    expect(reload).not.toHaveBeenCalled();
  });

  it('re-reads the list once a claim is filed', () => {
    renderScreen();
    fireEvent.click(screen.getByRole('button', { name: 'Claim time' }));
    fireEvent.click(screen.getByRole('button', { name: 'Finish claim' }));
    expect(screen.queryByTestId('manual-entry-form')).toBeNull();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('withdraws a pending claim after asking, then re-reads the list', async () => {
    renderScreen();
    withdrawAndConfirm();
    expect(tracker.withdrawManualEntry).toHaveBeenCalledWith('entry-1');
    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByTestId('rn-modal')).toBeNull());
  });

  it('shows why a withdrawal failed, and clears it when the next action starts', async () => {
    vi.mocked(tracker.withdrawManualEntry).mockRejectedValue(new Error('Already reviewed.'));
    renderScreen();
    withdrawAndConfirm();
    expect(await screen.findByText('Already reviewed.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Withdraw' }));
    expect(screen.queryByText('Already reviewed.')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByTestId('rn-modal')).toBeNull();
  });

  it('clears a withdrawal failure when a new claim is started', async () => {
    vi.mocked(tracker.withdrawManualEntry).mockRejectedValue(new Error('Already reviewed.'));
    renderScreen();
    withdrawAndConfirm();
    await screen.findByText('Already reviewed.');
    fireEvent.click(screen.getByRole('button', { name: 'Claim time' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel claim' }));
    expect(screen.queryByText('Already reviewed.')).toBeNull();
  });
});
