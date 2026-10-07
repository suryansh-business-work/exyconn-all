// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import MonthSwitcher from '../../../../src/renderer/components/MonthSwitcher';
import { button, clickElement, render, unmountAll } from '../../test-utils';

afterEach(unmountAll);

const SEPTEMBER = new Date(2026, 8, 1);

describe('MonthSwitcher', () => {
  it('names the month and steps back to the one before', async () => {
    const onChange = vi.fn();
    await render(<MonthSwitcher month={SEPTEMBER} canGoForward={false} onChange={onChange} />);
    expect(document.querySelector('h2')?.textContent).toBe('September 2026');
    await clickElement(button('Previous month'));
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 7, 1));
  });

  it('holds the next month shut until there is one to look at', async () => {
    await render(<MonthSwitcher month={SEPTEMBER} canGoForward={false} onChange={vi.fn()} />);
    expect(button('Next month').disabled).toBe(true);
  });

  it('steps forward across the year end', async () => {
    const onChange = vi.fn();
    await render(<MonthSwitcher month={new Date(2025, 11, 1)} canGoForward onChange={onChange} />);
    await clickElement(button('Next month'));
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 0, 1));
  });
});
