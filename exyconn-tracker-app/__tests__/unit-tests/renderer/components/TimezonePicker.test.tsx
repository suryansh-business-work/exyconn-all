// @vitest-environment jsdom
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TimezonePicker from '../../../../src/renderer/components/TimezonePicker';
import {
  clickElement,
  deferred,
  finish,
  render,
  stubTracker,
  typeInto,
  unmountAll,
} from '../../test-utils';
import { pageText } from './fixtures';

afterEach(() => {
  unmountAll();
  vi.restoreAllMocks();
});

function input(): HTMLInputElement {
  const field = document.querySelector<HTMLInputElement>('input[role="combobox"]');
  if (field === null) {
    throw new Error('No timezone field');
  }
  return field;
}

/** Filters the list down to `zone` and picks it. */
async function pick(zone: string): Promise<void> {
  await act(async () => input().focus());
  await typeInto(input(), zone);
  const option = [...document.querySelectorAll<HTMLElement>('[role="option"]')].find((node) =>
    (node.textContent ?? '').startsWith(zone),
  );
  if (option === undefined) {
    throw new Error(`No ${zone} option`);
  }
  expect(option.textContent).toContain('UTC');
  await act(async () => option.click());
}

function spinner(): Element | null {
  return document.querySelector('[aria-label="Saving…"]');
}

describe('TimezonePicker', () => {
  it('shows the zone in force, its offset and the time there now', async () => {
    await render(<TimezonePicker timezone="UTC" />);
    expect(input().value).toBe('UTC');
    expect(pageText()).toContain(
      'Every date and time in this app is shown in this zone (UTC+00:00).',
    );
    expect(pageText()).toMatch(/It is \d{1,2}:\d{2} (AM|PM) there right now\./);
  });

  it('saves the zone that is picked, holding the field while the portal answers', async () => {
    const saving = deferred<string>();
    const setTimezone = vi.fn(() => saving.promise);
    stubTracker({ setTimezone });
    await render(<TimezonePicker timezone="UTC" />);
    await pick('Europe/London');
    expect(setTimezone).toHaveBeenCalledWith('Europe/London');
    expect(spinner()).not.toBeNull();
    expect(input().disabled).toBe(true);

    await finish(() => saving.resolve('Europe/London'));
    expect(spinner()).toBeNull();
    expect(document.querySelector('.MuiAlert-colorError')).toBeNull();
  });

  it('says so when the zone could not be saved', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    stubTracker({ setTimezone: () => Promise.reject(new Error('Offline')) });
    await render(<TimezonePicker timezone="UTC" />);
    await pick('Asia/Tokyo');
    await finish(() => undefined);
    expect(document.querySelector('.MuiAlert-colorError')?.textContent).toBe(
      'Your timezone could not be saved. Check your connection and try again.',
    );
    expect(input().disabled).toBe(false);
  });

  it('opens the full list of zones from the arrow', async () => {
    await render(<TimezonePicker timezone="UTC" />);
    const open = document.querySelector<HTMLElement>('[aria-label="Open"]');
    if (open === null) {
      throw new Error('No open button');
    }
    await clickElement(open);
    expect(document.querySelectorAll('[role="option"]').length).toBeGreaterThan(100);
  });
});
