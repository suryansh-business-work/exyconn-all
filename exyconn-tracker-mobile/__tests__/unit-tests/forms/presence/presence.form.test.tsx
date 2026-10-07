import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import type { PresenceState } from '@exyconn/tracker-core';
import { describe, expect, it, vi } from 'vitest';
import { PRESENCE_NOTE_MAX, PresenceForm } from '../../../../src/forms/presence';
import { tracker } from '../../../../src/tracker/instance';
import { deferred } from '../../hooks/deferred';
import { renderWithProviders } from '../../test-utils';
import { inputOf, typeInto } from '../field';
import { failingOn } from '../unexpected';

vi.mock('../../../../src/tracker/instance', () => ({ tracker: { setPresence: vi.fn() } }));

const WORKING: PresenceState = { status: 'WORKING', note: '', since: null };

function pick(current: string, next: string): void {
  fireEvent.click(screen.getByRole('button', { name: `My status: ${current}` }));
  fireEvent.click(screen.getByRole('radio', { name: next }));
}

describe('PresenceForm', () => {
  it('shows the current status and what it means for tracking', () => {
    renderWithProviders(<PresenceForm presence={WORKING} timezone="UTC" />);
    expect(screen.getByRole('button', { name: 'My status: Working' })).toBeInTheDocument();
    expect(screen.getByText('Tracking runs as normal.')).toBeInTheDocument();
    expect(screen.getByText(`Up to ${PRESENCE_NOTE_MAX} characters.`)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save note' })).not.toBeInTheDocument();
  });

  it('applies a status the moment it is picked', async () => {
    vi.mocked(tracker.setPresence).mockResolvedValue(WORKING);
    renderWithProviders(<PresenceForm presence={WORKING} timezone="UTC" />);
    pick('Working', 'On lunch');
    await waitFor(() => expect(tracker.setPresence).toHaveBeenCalledWith('LUNCH', ''));
  });

  it('says it is saving while the status is on its way', async () => {
    const saving = deferred<PresenceState>();
    vi.mocked(tracker.setPresence).mockReturnValue(saving.promise);
    renderWithProviders(<PresenceForm presence={WORKING} timezone="UTC" />);
    pick('Working', 'Away');
    expect(await screen.findByText('Saving…')).toBeInTheDocument();
    await act(async () => {
      saving.resolve(WORKING);
      await saving.promise;
    });
    await waitFor(() => expect(screen.queryByText('Saving…')).not.toBeInTheDocument());
  });

  it('offers to save a changed note, from the button or the return key', async () => {
    vi.mocked(tracker.setPresence).mockResolvedValue(WORKING);
    renderWithProviders(<PresenceForm presence={WORKING} timezone="UTC" />);
    typeInto('note', 'Back at 2 ');
    fireEvent.click(screen.getByRole('button', { name: 'Save note' }));
    await waitFor(() => expect(tracker.setPresence).toHaveBeenCalledWith('WORKING', 'Back at 2'));
    fireEvent.keyDown(inputOf('note'), { key: 'Enter' });
    await waitFor(() => expect(tracker.setPresence).toHaveBeenCalledTimes(2));
  });

  it("holds the note to the portal's limit", async () => {
    renderWithProviders(<PresenceForm presence={WORKING} timezone="UTC" />);
    typeInto('note', 'a'.repeat(PRESENCE_NOTE_MAX + 1));
    fireEvent.click(screen.getByRole('button', { name: 'Save note' }));
    expect(
      await screen.findByText(`Keep the note to ${PRESENCE_NOTE_MAX} characters.`),
    ).toBeInTheDocument();
    expect(tracker.setPresence).not.toHaveBeenCalled();
  });

  it('puts back what was recorded, and says why, when the portal refuses', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const cause = new Error('You are signed out.');
    vi.mocked(tracker.setPresence).mockRejectedValue(cause);
    renderWithProviders(<PresenceForm presence={WORKING} timezone="UTC" />);
    pick('Working', 'In a meeting');
    expect(await screen.findByText('You are signed out.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'My status: Working' })).toBeInTheDocument();
    expect(error).toHaveBeenCalledWith('Setting presence failed', cause);
  });

  it('falls back to a plain sentence when the refusal has no reason', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(tracker.setPresence).mockRejectedValue('nope');
    renderWithProviders(<PresenceForm presence={WORKING} timezone="UTC" />);
    pick('Working', 'On a break');
    expect(await screen.findByText('Could not update your status.')).toBeInTheDocument();
  });

  it('follows a status set from another device', () => {
    const { rerender } = renderWithProviders(<PresenceForm presence={WORKING} timezone="UTC" />);
    rerender(
      <PresenceForm
        presence={{ status: 'AWAY', note: 'Client site', since: '2026-09-11T09:00:00.000Z' }}
        timezone="UTC"
      />,
    );
    expect(screen.getByRole('button', { name: 'My status: Away' })).toBeInTheDocument();
    expect(inputOf('note')).toHaveValue('Client site');
    expect(
      screen.getByText(/tracking stays paused until you are back on Working/),
    ).toBeInTheDocument();
  });

  it('logs a failure it did not expect while handling a refusal', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const failure = new Error('Translations unavailable');
    vi.mocked(tracker.setPresence).mockRejectedValue(new Error('offline'));
    renderWithProviders(<PresenceForm presence={WORKING} timezone="UTC" />, {
      onMissing: failingOn('Could not update your status.', failure),
    });
    pick('Working', 'Away');
    await waitFor(() => expect(error).toHaveBeenCalledWith('Setting presence failed', failure));
  });
});
