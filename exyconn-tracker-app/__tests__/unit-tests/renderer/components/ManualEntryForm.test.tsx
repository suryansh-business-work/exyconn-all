// @vitest-environment jsdom
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdapterDateFns, LocalizationProvider } from '@exyconn/ui';
import type { TrackerProject } from '@shared/types';
import ManualEntryForm from '../../../../src/renderer/components/ManualEntryForm';
import {
  button,
  choose,
  clickElement,
  flush,
  render,
  stubTracker,
  unmountAll,
} from '../../test-utils';
import { manualEntry } from './fixtures';

afterEach(() => {
  unmountAll();
  vi.restoreAllMocks();
});

const PROJECTS: TrackerProject[] = [{ id: 'p1', name: 'Global Project', key: 'GLOBAL' }];

async function mountForm(projects: TrackerProject[], onCancel = vi.fn()): Promise<void> {
  await render(
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <ManualEntryForm projects={projects} onCancel={onCancel} onDone={vi.fn()} />
    </LocalizationProvider>,
  );
}

/** Sets a React-controlled field the way a keystroke would. */
async function setValue(
  field: HTMLInputElement | HTMLTextAreaElement,
  value: string,
): Promise<void> {
  const proto = Object.getPrototypeOf(field);
  await act(async () => {
    Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(field, value);
    field.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

function pickers(): HTMLInputElement[] {
  return [...document.querySelectorAll<HTMLInputElement>('input.MuiPickersInputBase-input')];
}

function noteBox(): HTMLTextAreaElement {
  const box = document.querySelector<HTMLTextAreaElement>('textarea:not([aria-hidden])');
  if (box === null) {
    throw new Error('No note box');
  }
  return box;
}

describe('ManualEntryForm', () => {
  it('books the claim to the ticket that was picked', async () => {
    const createManualEntry = vi.fn(() => Promise.resolve(manualEntry()));
    stubTracker({
      getTasks: () =>
        Promise.resolve([{ id: 't1', key: 'EXY-1', title: 'Onboarding', assignedToMe: true }]),
      createManualEntry,
    });
    await mountForm(PROJECTS);
    await flush();
    await choose('Ticket', 'EXY-1 · Onboarding');
    await setValue(pickers()[0], '09/14/2026 09:00 AM');
    await setValue(pickers()[1], '09/14/2026 10:00 AM');
    await setValue(noteBox(), '  Site visit  ');
    await clickElement(button('Submit claim'));
    expect(createManualEntry).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: 'p1', taskId: 't1', note: 'Site visit' }),
    );
  });

  it('marks only the empty boxes once a submit was tried', async () => {
    stubTracker({ getTasks: () => Promise.resolve([]), createManualEntry: vi.fn() });
    await mountForm(PROJECTS);
    await setValue(noteBox(), 'Client call');
    await clickElement(button('Submit claim'));
    expect(noteBox().getAttribute('aria-invalid')).toBe('false');
    // The two time pickers, and nothing else.
    expect(document.querySelectorAll('label.Mui-error')).toHaveLength(2);
  });

  it('reads no tickets when there is no project to book to, and cancels on request', async () => {
    const getTasks = vi.fn(() => Promise.resolve([]));
    const onCancel = vi.fn();
    stubTracker({ getTasks });
    await mountForm([], onCancel);
    await flush();
    expect(getTasks).not.toHaveBeenCalled();
    await clickElement(button('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
