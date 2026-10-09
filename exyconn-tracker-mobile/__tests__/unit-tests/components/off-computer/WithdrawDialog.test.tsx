import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { formatDateTime } from '@exyconn/tracker-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WithdrawDialog } from '../../../../src/components/off-computer/WithdrawDialog';
import { tracker } from '../../../../src/tracker/instance';
import { renderWithProviders } from '../../test-utils';
import { manualEntry } from '../state';

vi.mock('../../../../src/tracker/instance', () => ({
  tracker: { withdrawManualEntry: vi.fn() },
}));

const ZONE = 'Asia/Kolkata';

function callbacks() {
  return { onClose: vi.fn(), onWithdrawn: vi.fn(), onFailed: vi.fn() };
}

function renderDialog(handlers = callbacks(), entry = manualEntry()) {
  renderWithProviders(
    <WithdrawDialog
      entry={entry}
      timezone={ZONE}
      returnFocusTo={{ current: null }}
      {...handlers}
    />,
  );
  return handlers;
}

function confirm() {
  fireEvent.click(within(screen.getByTestId('rn-modal')).getByRole('button', { name: 'Withdraw' }));
}

beforeEach(() => {
  vi.mocked(tracker.withdrawManualEntry).mockResolvedValue(undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

/** An error that carries no text, so the screen has to fall back to its own words. */
const NO_MESSAGE = '';

describe('WithdrawDialog', () => {
  it('stays closed while no claim is being withdrawn', () => {
    renderWithProviders(
      <WithdrawDialog
        entry={null}
        timezone={ZONE}
        returnFocusTo={{ current: null }}
        {...callbacks()}
      />,
    );
    expect(screen.queryByTestId('rn-modal')).toBeNull();
  });

  it('names the claim it is about before anything is deleted', () => {
    const entry = manualEntry();
    renderDialog(callbacks(), entry);
    expect(screen.getByText('Withdraw this claim?')).toBeInTheDocument();
    expect(
      screen.getByText(
        `Your claim for 1h 30m from ${formatDateTime(entry.startedAt, ZONE)} will be removed before anybody reviews it. File it again if you change your mind.`,
      ),
    ).toBeInTheDocument();
    expect(tracker.withdrawManualEntry).not.toHaveBeenCalled();
  });

  it('closes on Cancel without touching the claim', () => {
    const handlers = renderDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(handlers.onClose).toHaveBeenCalledTimes(1);
    expect(tracker.withdrawManualEntry).not.toHaveBeenCalled();
  });

  it('withdraws the claim, refreshes the list and closes', async () => {
    const handlers = renderDialog();
    confirm();
    expect(tracker.withdrawManualEntry).toHaveBeenCalledWith('entry-1');
    await waitFor(() => expect(handlers.onWithdrawn).toHaveBeenCalledTimes(1));
    expect(handlers.onClose).toHaveBeenCalledTimes(1);
    expect(handlers.onFailed).not.toHaveBeenCalled();
  });

  it('holds both buttons while the portal is deleting it', async () => {
    let finish: () => void = () => undefined;
    vi.mocked(tracker.withdrawManualEntry).mockReturnValue(
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
    );
    const handlers = renderDialog();
    confirm();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Cancel' })).toHaveAttribute(
        'aria-disabled',
        'true',
      ),
    );
    finish();
    await waitFor(() => expect(handlers.onClose).toHaveBeenCalled());
  });

  it('reports the portal’s reason when it refuses', async () => {
    const refusal = new Error('This claim has already been reviewed.');
    vi.mocked(tracker.withdrawManualEntry).mockRejectedValue(refusal);
    const handlers = renderDialog();
    confirm();
    await waitFor(() =>
      expect(handlers.onFailed).toHaveBeenCalledWith('This claim has already been reviewed.'),
    );
    expect(handlers.onWithdrawn).not.toHaveBeenCalled();
    expect(handlers.onClose).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith('Withdrawing the claim failed', refusal);
  });

  it('falls back to its own sentence when the failure says nothing', async () => {
    vi.mocked(tracker.withdrawManualEntry).mockRejectedValue(new Error(NO_MESSAGE));
    const handlers = renderDialog();
    confirm();
    await waitFor(() =>
      expect(handlers.onFailed).toHaveBeenCalledWith('The claim could not be withdrawn.'),
    );
  });

  it('logs a failure the screen itself could not handle', async () => {
    const broken = new Error('state update failed');
    vi.mocked(tracker.withdrawManualEntry).mockRejectedValue(new Error('offline'));
    const handlers = callbacks();
    handlers.onFailed.mockImplementation(() => {
      throw broken;
    });
    renderDialog(handlers);
    confirm();
    await waitFor(() => expect(console.error).toHaveBeenCalledWith('Withdraw failed', broken));
    expect(handlers.onClose).toHaveBeenCalledTimes(1);
  });
});
