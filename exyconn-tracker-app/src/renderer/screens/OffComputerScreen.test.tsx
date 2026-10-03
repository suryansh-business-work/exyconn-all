// @vitest-environment jsdom
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ManualEntry } from '@shared/types';
import OffComputerScreen from './OffComputerScreen';
import {
  button,
  click,
  deferred,
  flush,
  render,
  stubTracker,
  unmountAll,
} from '../a11y/component-harness';

afterEach(() => {
  unmountAll();
  vi.restoreAllMocks();
});

function entry(id: string): ManualEntry {
  return {
    id,
    projectName: 'Global Project',
    taskKey: id === 'e1' ? '' : 'EXY-1',
    taskTitle: 'Onboarding',
    startedAt: '2026-09-14T09:00:00.000Z',
    endedAt: '2026-09-14T10:00:00.000Z',
    durationMs: 3_600_000,
    note: 'Client visit',
    status: 'PENDING',
    reviewNote: id === 'e1' ? '' : 'Looks fine',
  };
}

const PROJECTS = [{ id: 'p1', name: 'Global Project', key: 'GLOBAL' }];

/** The Withdraw buttons on the list's rows (the dialog's own is not one of them). */
function withdrawButtons(): HTMLButtonElement[] {
  return [...document.querySelectorAll<HTMLButtonElement>('button')].filter(
    (node) => node.textContent === 'Withdraw' && node.closest('[role="dialog"]') === null,
  );
}

function dialog(): HTMLElement | null {
  return document.querySelector('[role="dialog"]');
}

function dialogButton(label: string): HTMLButtonElement {
  const found = [...(dialog()?.querySelectorAll<HTMLButtonElement>('button') ?? [])].find(
    (node) => node.textContent === label,
  );
  if (found === undefined) {
    throw new Error(`No dialog button "${label}"`);
  }
  return found;
}

describe('OffComputerScreen', () => {
  it('shows a labelled spinner until the first answer, not the empty message', async () => {
    const answer = deferred<ManualEntry[]>();
    stubTracker({ getManualEntries: () => answer.promise });
    await render(<OffComputerScreen projects={PROJECTS} timezone="UTC" />);
    expect(document.querySelector('[aria-label="Loading your claims"]')).not.toBeNull();
    expect(document.body.textContent).not.toContain('You have not claimed');
    answer.resolve([]);
    await flush();
    expect(document.querySelector('[aria-label="Loading your claims"]')).toBeNull();
    expect(document.body.textContent).toContain('You have not claimed');
  });

  it('asks first, naming the claim, and does nothing when the question is cancelled', async () => {
    const withdrawManualEntry = vi.fn(() => Promise.resolve());
    stubTracker({ getManualEntries: () => Promise.resolve([entry('e1')]), withdrawManualEntry });
    await render(<OffComputerScreen projects={PROJECTS} timezone="UTC" />);
    await flush();
    await click(withdrawButtons()[0]);
    expect(dialog()?.textContent).toContain('Withdraw this claim?');
    expect(dialog()?.textContent).toContain('Your claim for 1h');
    await click(dialogButton('Cancel'));
    await vi.waitFor(() => expect(dialog()).toBeNull());
    expect(withdrawManualEntry).not.toHaveBeenCalled();
  });

  it('spins on the dialog’s Withdraw, locks the rows, then reloads the list', async () => {
    const withdrawal = deferred<undefined>();
    const getManualEntries = vi
      .fn()
      .mockResolvedValueOnce([entry('e1'), entry('e2')])
      .mockResolvedValueOnce([entry('e2')]);
    stubTracker({ getManualEntries, withdrawManualEntry: () => withdrawal.promise });
    await render(<OffComputerScreen projects={PROJECTS} timezone="UTC" />);
    await flush();

    await click(withdrawButtons()[0]);
    await click(dialogButton('Withdraw'));
    expect(dialogButton('Withdraw').className).toContain('MuiButton-loading');
    expect(dialogButton('Cancel').disabled).toBe(true);
    const [first, second] = withdrawButtons();
    expect(first.className).toContain('MuiButton-loading');
    expect(second.disabled).toBe(true);
    // The list stays on screen while it reloads, rather than flashing a spinner.
    withdrawal.resolve(undefined);
    await flush();
    await flush();
    expect(getManualEntries).toHaveBeenCalledTimes(2);
    await vi.waitFor(() => expect(dialog()).toBeNull());
    expect(withdrawButtons()).toHaveLength(1);
    expect(document.querySelector('[aria-label="Loading your claims"]')).toBeNull();
  });

  it('shows why a withdrawal failed, and clears it when a claim form opens', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    stubTracker({
      getManualEntries: () => Promise.resolve([entry('e1')]),
      withdrawManualEntry: () => Promise.reject(new Error('Already decided')),
      getTasks: () => Promise.resolve([]),
    });
    await render(<OffComputerScreen projects={PROJECTS} timezone="UTC" />);
    await flush();
    await click(withdrawButtons()[0]);
    await click(dialogButton('Withdraw'));
    await flush();
    expect(document.querySelector('[role="alert"]')?.textContent).toContain('Already decided');
    expect(withdrawButtons()[0].disabled).toBe(false);

    await click(button('Claim time'));
    await click(button('Cancel'));
    expect(document.querySelector('[role="alert"]')).toBeNull();
  });

  it('goes back to the list and reloads it once a claim is filed', async () => {
    const getManualEntries = vi.fn(() => Promise.resolve([entry('e1')]));
    stubTracker({
      getManualEntries,
      getTasks: () => Promise.resolve([]),
      createManualEntry: () => Promise.resolve(entry('e3')),
    });
    await render(<OffComputerScreen projects={PROJECTS} timezone="UTC" />);
    await flush();
    await click(button('Claim time'));
    const inputs = document.querySelectorAll<HTMLInputElement>('input.MuiPickersInputBase-input');
    const note = document.querySelector<HTMLTextAreaElement>('textarea:not([aria-hidden])');
    await act(async () => {
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      set?.call(inputs[0], '09/14/2026 09:00 AM');
      inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
      set?.call(inputs[1], '09/14/2026 10:00 AM');
      inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set?.call(
        note,
        'Visit',
      );
      note?.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await click(button('Submit claim'));
    expect(document.querySelector('form')).toBeNull();
    expect(getManualEntries).toHaveBeenCalledTimes(2);
  });

  it('says so when the claims could not be read', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    stubTracker({ getManualEntries: () => Promise.reject(new Error('Offline')) });
    await render(<OffComputerScreen projects={PROJECTS} timezone="UTC" />);
    await flush();
    expect(document.querySelector('[role="alert"]')?.textContent).toContain(
      'Could not load your claims.',
    );
  });
});
