// @vitest-environment jsdom
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TabBar from '../../../../src/renderer/components/TabBar';
import { clickElement, render, unmountAll, withProviders } from '../../test-utils';

afterEach(unmountAll);

function tabs(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>('[role="tab"]')];
}

function tab(id: string): HTMLElement {
  const found = document.getElementById(`sections-tab-${id}`);
  if (found === null) {
    throw new Error(`No ${id} tab`);
  }
  return found;
}

async function press(key: string): Promise<void> {
  await act(async () => {
    tab('report').dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  });
}

describe('TabBar', () => {
  it('shows the five sections with only the selected one named on its pill', async () => {
    await render(<TabBar section="report" unreadMessages={0} onSelect={vi.fn()} />);
    expect(tabs()).toHaveLength(5);
    expect(tab('report').getAttribute('aria-selected')).toBe('true');
    expect(tab('report').tabIndex).toBe(0);
    expect(tab('report').querySelector('.MuiTypography-root')?.textContent).toBe('Report');
    expect(tab('dashboard').querySelector('.MuiTypography-root')).toBeNull();
    expect(tab('dashboard').getAttribute('aria-selected')).toBe('false');
    expect(tab('dashboard').tabIndex).toBe(-1);
    expect(tab('dashboard').getAttribute('aria-label')).toBe('Home');
    expect(tab('messages').getAttribute('aria-label')).toBe('Messages');
  });

  it('counts unread messages on the Messages tab', async () => {
    await render(<TabBar section="dashboard" unreadMessages={3} onSelect={vi.fn()} />);
    expect(tab('messages').getAttribute('aria-label')).toBe('Messages, 3 unread');
    expect(tab('messages').textContent).toContain('3');
  });

  it('selects a section on click', async () => {
    const onSelect = vi.fn();
    await render(<TabBar section="dashboard" unreadMessages={0} onSelect={onSelect} />);
    await clickElement(tab('settings'));
    expect(onSelect).toHaveBeenCalledWith('settings');
  });

  it('moves along the bar with the arrow keys and ignores every other key', async () => {
    const onSelect = vi.fn();
    await render(<TabBar section="report" unreadMessages={0} onSelect={onSelect} />);
    await press('ArrowRight');
    expect(onSelect).toHaveBeenLastCalledWith('messages');
    expect(document.activeElement).toBe(tab('messages'));
    await press('Home');
    expect(onSelect).toHaveBeenLastCalledWith('dashboard');
    onSelect.mockClear();
    await press('a');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('reverses the arrows in a right-to-left language', async () => {
    const onSelect = vi.fn();
    await render(
      withProviders(<TabBar section="report" unreadMessages={0} onSelect={onSelect} />, {
        locale: 'ar',
      }),
    );
    await press('ArrowLeft');
    expect(onSelect).toHaveBeenLastCalledWith('messages');
  });
});
