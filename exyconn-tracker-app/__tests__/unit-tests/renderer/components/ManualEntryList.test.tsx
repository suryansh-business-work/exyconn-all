// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import ManualEntryList from '../../../../src/renderer/components/ManualEntryList';
import { button, clickElement, render, unmountAll } from '../../test-utils';
import { manualEntry, pageText } from './fixtures';

afterEach(unmountAll);

const PENDING = manualEntry();
const APPROVED = manualEntry({
  id: 'claim-2',
  status: 'APPROVED',
  taskKey: 'EXY-7',
  taskTitle: 'Workshop',
  reviewNote: 'Thanks for the notes',
});
const REJECTED = manualEntry({ id: 'claim-3', status: 'REJECTED', note: 'Lunch' });

function withdrawButtons(): HTMLButtonElement[] {
  return [...document.querySelectorAll<HTMLButtonElement>('button')].filter(
    (node) => node.textContent === 'Withdraw',
  );
}

describe('ManualEntryList', () => {
  it('says so when nothing has been claimed', async () => {
    await render(
      <ManualEntryList entries={[]} timezone="UTC" withdrawing={null} onWithdraw={vi.fn()} />,
    );
    expect(pageText()).toBe('You have not claimed any off-computer time in the last 90 days.');
  });

  it('shows where each claim stands, and what it was booked to', async () => {
    await render(
      <ManualEntryList
        entries={[PENDING, APPROVED, REJECTED]}
        timezone="UTC"
        withdrawing={null}
        onWithdraw={vi.fn()}
      />,
    );
    expect(pageText()).toContain('1h 30m');
    expect(pageText()).toContain('Mon 14 Sep, 9:00 AM — Mon 14 Sep, 10:30 AM');
    expect(pageText()).toContain('Waiting on a decision');
    expect(pageText()).toContain('Approved');
    expect(pageText()).toContain('Rejected');
    expect(pageText()).toContain('Global Project · EXY-7 Workshop');
    expect(pageText()).toContain('Reviewer: Thanks for the notes');
    expect(document.querySelector('.MuiChip-colorSuccess')?.textContent).toBe('Approved');
    expect(document.querySelector('.MuiChip-colorError')?.textContent).toBe('Rejected');
    // Only a claim nobody has decided on yet can be taken back.
    expect(withdrawButtons()).toHaveLength(1);
  });

  it('hands the pending claim over to be withdrawn', async () => {
    const onWithdraw = vi.fn();
    await render(
      <ManualEntryList
        entries={[PENDING]}
        timezone="UTC"
        withdrawing={null}
        onWithdraw={onWithdraw}
      />,
    );
    await clickElement(button('Withdraw'));
    expect(onWithdraw).toHaveBeenCalledWith(PENDING);
  });

  it('spins on the claim being withdrawn and holds every other one', async () => {
    const other = manualEntry({ id: 'claim-4' });
    await render(
      <ManualEntryList
        entries={[PENDING, other]}
        timezone="UTC"
        withdrawing="claim-1"
        onWithdraw={vi.fn()}
      />,
    );
    const [busy, held] = withdrawButtons();
    expect(busy.className).toContain('MuiButton-loading');
    expect(busy.disabled).toBe(true);
    expect(held.className).not.toContain('MuiButton-loading');
    expect(held.disabled).toBe(true);
  });
});
