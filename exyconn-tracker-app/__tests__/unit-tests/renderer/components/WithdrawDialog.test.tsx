// @vitest-environment jsdom
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ManualEntry } from '@shared/types';
import WithdrawDialog from '../../../../src/renderer/components/WithdrawDialog';
import { button, clickElement, render, rerender, unmountAll } from '../../test-utils';
import { manualEntry } from './fixtures';

afterEach(unmountAll);

const ENTRY = manualEntry();

function dialog(entry: ManualEntry | null, busy: boolean, onCancel = vi.fn(), onConfirm = vi.fn()) {
  return (
    <WithdrawDialog
      entry={entry}
      timezone="UTC"
      busy={busy}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}

async function pressEscape(): Promise<void> {
  await act(async () => {
    document
      .querySelector('[role="dialog"]')
      ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  });
}

describe('WithdrawDialog', () => {
  it('stays shut while no claim is chosen', async () => {
    await render(dialog(null, false));
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it('names the claim it is about and withdraws it on confirm', async () => {
    const onConfirm = vi.fn();
    await render(dialog(ENTRY, false, vi.fn(), onConfirm));
    const shown = document.querySelector('[role="dialog"]');
    expect(shown?.querySelector('h2')?.textContent).toBe('Withdraw this claim?');
    expect(shown?.textContent).toContain(
      'Your claim for 1h 30m from Mon 14 Sep, 9:00 AM will be removed before anybody reviews it.',
    );
    await clickElement(button('Withdraw'));
    expect(onConfirm).toHaveBeenCalledWith(ENTRY);
  });

  it('backs out on Cancel or Escape', async () => {
    const onCancel = vi.fn();
    await render(dialog(ENTRY, false, onCancel));
    await clickElement(button('Cancel'));
    await pressEscape();
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it('offers no way out while the withdrawal is on its way', async () => {
    const onCancel = vi.fn();
    await render(dialog(ENTRY, true, onCancel));
    expect(button('Cancel').disabled).toBe(true);
    expect(button('Withdraw').className).toContain('MuiButton-loading');
    await pressEscape();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('ignores a press that lands while the dialog is fading out', async () => {
    const onConfirm = vi.fn();
    await render(dialog(ENTRY, false, vi.fn(), onConfirm));
    await rerender(dialog(null, false, vi.fn(), onConfirm));
    await act(async () => button('Withdraw').click());
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
