import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MAX_WIDGET_MESSAGE,
  WidgetComposerForm,
  widgetComposerSchema,
} from '../../../../../src/widget/forms/widget-composer';
import { renderWithProviders } from '../../../test-utils';

const logger = vi.hoisted(() => ({ portalLogger: { error: vi.fn() } }));
vi.mock('@exyconn/shell/logging/portalLogger', () => logger);

afterEach(() => {
  logger.portalLogger.error.mockReset();
});

function mount(onSend = vi.fn()) {
  renderWithProviders(<WidgetComposerForm onSend={onSend} placeholder="Ask anything" />);
  return {
    onSend,
    box: screen.getByRole('textbox', { name: 'Type a message' }),
    send: screen.getByRole('button', { name: 'Send' }),
  };
}

describe('widgetComposerSchema', () => {
  it('trims the message and requires some text', () => {
    expect(widgetComposerSchema.parse({ message: '  hi  ' })).toEqual({ message: 'hi' });
    expect(widgetComposerSchema.safeParse({ message: '   ' }).error?.issues[0].message).toBe(
      'Type a message first',
    );
  });

  it('accepts the longest message and refuses one character more', () => {
    const longest = 'a'.repeat(MAX_WIDGET_MESSAGE);
    expect(widgetComposerSchema.safeParse({ message: longest }).success).toBe(true);
    expect(
      widgetComposerSchema.safeParse({ message: `${longest}a` }).error?.issues[0].message,
    ).toBe('Keep it under 1000 characters');
  });
});

describe('WidgetComposerForm', () => {
  it('keeps Send disabled until there is text, and caps the box at the longest message', async () => {
    const { box, send } = mount();
    expect(box).toHaveAttribute('placeholder', 'Ask anything');
    expect(box).toHaveAttribute('maxlength', String(MAX_WIDGET_MESSAGE));
    expect(send).toBeDisabled();
    await userEvent.type(box, '   ');
    expect(send).toBeDisabled();
    await userEvent.type(box, 'x');
    expect(send).toBeEnabled();
  });

  it('sends the trimmed text on Enter and clears the box', async () => {
    const { box, onSend } = mount();
    await userEvent.type(box, '  Opening hours?  {Enter}');
    await waitFor(() => expect(onSend).toHaveBeenCalledWith('Opening hours?'));
    expect(box).toHaveValue('');
  });

  it('adds a line on Shift+Enter instead of sending', async () => {
    const { box, onSend } = mount();
    await userEvent.type(box, 'Line one{Shift>}{Enter}{/Shift}Line two');
    expect(box).toHaveValue('Line one\nLine two');
    expect(onSend).not.toHaveBeenCalled();
  });

  it('sends from the Send button', async () => {
    const { box, send, onSend } = mount();
    await userEvent.type(box, 'Hello');
    await userEvent.click(send);
    await waitFor(() => expect(onSend).toHaveBeenCalledWith('Hello'));
  });

  it('sends nothing for blank text submitted with Enter', async () => {
    const { box, onSend } = mount();
    await userEvent.type(box, '   {Enter}');
    expect(onSend).not.toHaveBeenCalled();
    expect(logger.portalLogger.error).not.toHaveBeenCalled();
  });

  it('logs a send that fails instead of losing it silently', async () => {
    const failure = new Error('offline');
    const { box } = mount(
      vi.fn(() => {
        throw failure;
      }),
    );
    await userEvent.type(box, 'Hello{Enter}');
    await waitFor(() =>
      expect(logger.portalLogger.error).toHaveBeenCalledWith('website chat: send failed', failure),
    );
  });
});
