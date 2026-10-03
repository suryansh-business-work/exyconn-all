// @vitest-environment jsdom
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MessageComposer from './MessageComposer';
import { button, click, render, rerender, unmountAll } from '../a11y/component-harness';

afterEach(() => {
  unmountAll();
  vi.restoreAllMocks();
});

async function type(value: string): Promise<void> {
  const box = document.querySelector<HTMLTextAreaElement>('textarea:not([aria-hidden])');
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set?.call(box, value);
    box?.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

async function pressEnter(shiftKey = false): Promise<void> {
  const box = document.querySelector('textarea:not([aria-hidden])');
  await act(async () => {
    box?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', shiftKey, bubbles: true }));
  });
}

describe('MessageComposer', () => {
  it('spins on Send while the message is on its way', async () => {
    await render(<MessageComposer sending onSend={() => Promise.resolve()} />);
    const send = button('Send message');
    expect(send.disabled).toBe(true);
    expect(send.querySelector('[role="progressbar"]')).not.toBeNull();
  });

  it('clears the box once the portal has the message', async () => {
    const onSend = vi.fn(() => Promise.resolve());
    await render(<MessageComposer sending={false} onSend={onSend} />);
    await pressEnter();
    expect(onSend).not.toHaveBeenCalled();
    await type('  Hello  ');
    await pressEnter(true);
    expect(onSend).not.toHaveBeenCalled();
    await pressEnter();
    expect(onSend).toHaveBeenCalledWith('Hello');
    expect(document.querySelector('textarea')?.value).toBe('');
  });

  it('keeps what was typed and says why when the send fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const onSend = vi.fn(() => Promise.reject(new Error('Offline')));
    await render(<MessageComposer sending={false} onSend={onSend} />);
    await click(button('Send message'));
    expect(onSend).not.toHaveBeenCalled();
    await type('Hello');
    await click(button('Send message'));
    expect(document.querySelector('[role="alert"]')?.textContent).toBe('Offline');
    expect(document.querySelector('textarea')?.value).toBe('Hello');

    await rerender(<MessageComposer sending={false} onSend={() => Promise.resolve()} />);
    await click(button('Send message'));
    expect(document.querySelector('[role="alert"]')).toBeNull();
  });
});
