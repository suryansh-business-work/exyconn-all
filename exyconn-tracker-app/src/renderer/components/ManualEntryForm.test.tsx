// @vitest-environment jsdom
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdapterDateFns, LocalizationProvider } from '@exyconn/ui';
import type { ManualEntry, TrackerTask } from '@shared/types';
import ManualEntryForm from './ManualEntryForm';
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

const PROJECTS = [
  { id: 'p1', name: 'Global Project', key: 'GLOBAL' },
  { id: 'p2', name: 'Client Work', key: 'CLIENT' },
];

async function mountForm(onDone = vi.fn()): Promise<void> {
  await render(
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <ManualEntryForm projects={PROJECTS} onCancel={() => undefined} onDone={onDone} />
    </LocalizationProvider>,
  );
}

/** Types a value into the nth picker the way MUI X's hidden input takes it. */
async function pick(index: number, value: string): Promise<void> {
  const input = document.querySelectorAll<HTMLInputElement>('input.MuiPickersInputBase-input')[
    index
  ];
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

async function type(value: string): Promise<void> {
  const box = document.querySelector<HTMLTextAreaElement>('textarea:not([aria-hidden])');
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set?.call(box, value);
    box?.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

describe('ManualEntryForm', () => {
  it('says the tickets are loading, and keeps the field shut until they arrive', async () => {
    const answer = deferred<TrackerTask[]>();
    stubTracker({ getTasks: () => answer.promise });
    await mountForm();
    expect(document.body.textContent).toContain('Loading tickets…');
    answer.resolve([{ id: 't1', key: 'EXY-1', title: 'Onboarding', assignedToMe: true }]);
    await flush();
    expect(document.body.textContent).not.toContain('Loading tickets…');
  });

  it('asks for the missing boxes before anything is sent', async () => {
    const createManualEntry = vi.fn();
    stubTracker({ getTasks: () => Promise.resolve([]), createManualEntry });
    await mountForm();
    await click(button('Submit claim'));
    expect(document.querySelector('[role="alert"]')?.textContent).toContain(
      'Fill in when the work happened',
    );
    expect(createManualEntry).not.toHaveBeenCalled();
  });

  it('spins on Submit while the claim is filed, and shows the portal’s refusal', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const filing = deferred<ManualEntry>();
    const createManualEntry = vi.fn(() => filing.promise);
    stubTracker({ getTasks: () => Promise.resolve([]), createManualEntry });
    await mountForm();
    await pick(0, '09/14/2026 09:00 AM');
    await pick(1, '09/14/2026 10:00 AM');
    await type('Client visit');
    await click(button('Submit claim'));
    expect(createManualEntry).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: 'p1', taskId: '', note: 'Client visit' }),
    );
    expect(button('Submit claim').className).toContain('MuiButton-loading');
    expect(button('Cancel').disabled).toBe(true);
    filing.reject(new Error('That window overlaps another claim.'));
    await flush();
    expect(document.querySelector('[role="alert"]')?.textContent).toContain(
      'That window overlaps another claim.',
    );
    expect(button('Submit claim').className).not.toContain('MuiButton-loading');
  });

  it('hands over once the portal has filed the claim', async () => {
    const onDone = vi.fn();
    stubTracker({
      getTasks: () => Promise.resolve([]),
      createManualEntry: () => Promise.resolve({} as ManualEntry),
    });
    await mountForm(onDone);
    await pick(0, '09/14/2026 09:00 AM');
    await pick(1, '09/14/2026 10:00 AM');
    await type('Client visit');
    await click(button('Submit claim'));
    expect(onDone).toHaveBeenCalled();
  });

  it('drops the ticket and reads the new project’s tickets when the project changes', async () => {
    const getTasks = vi.fn(() => Promise.resolve([]));
    stubTracker({ getTasks });
    await mountForm();
    const project = document.querySelector('[role="combobox"]');
    await act(async () => {
      project?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));
    });
    const option = [...document.querySelectorAll<HTMLElement>('[role="option"]')].find(
      (node) => node.textContent === 'Client Work',
    );
    if (option === undefined) {
      throw new Error('No Client Work option');
    }
    await click(option);
    expect(getTasks).toHaveBeenLastCalledWith('p2');
  });
});
