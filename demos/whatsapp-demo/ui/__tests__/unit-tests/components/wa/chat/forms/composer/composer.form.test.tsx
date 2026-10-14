import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ComposerForm,
  MAX_MESSAGE_LENGTH,
  composerSchema,
} from '../../../../../../../src/components/wa/chat/forms/composer';
import { renderWithProviders } from '../../../../../test-utils';

const view = vi.hoisted(() => ({ compact: false, logError: vi.fn() }));

vi.mock('../../../../../../../src/theme/useWa', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useCompact: () => view.compact,
}));
vi.mock('@exyconn/shell/logging/portalLogger', () => ({
  portalLogger: { error: view.logError, warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

function renderComposer(onSend = vi.fn()) {
  const onUnavailable = vi.fn();
  renderWithProviders(<ComposerForm onSend={onSend} onUnavailable={onUnavailable} />);
  const box = screen.getByRole('textbox', { name: 'Type a message' });
  return { onSend, onUnavailable, box, user: userEvent.setup() };
}

afterEach(() => {
  view.compact = false;
  vi.clearAllMocks();
});

describe('composerSchema', () => {
  it('trims the message and needs at least one character', () => {
    expect(composerSchema.parse({ message: '  hi  ' })).toEqual({ message: 'hi' });
    expect(composerSchema.safeParse({ message: '   ' }).success).toBe(false);
  });

  it(`allows at most ${MAX_MESSAGE_LENGTH} characters`, () => {
    expect(composerSchema.safeParse({ message: 'a'.repeat(MAX_MESSAGE_LENGTH) }).success).toBe(
      true,
    );
    expect(composerSchema.safeParse({ message: 'a'.repeat(MAX_MESSAGE_LENGTH + 1) }).success).toBe(
      false,
    );
  });
});

describe('ComposerForm', () => {
  it('sends the trimmed text on Enter and clears the box', async () => {
    const { user, box, onSend } = renderComposer();
    expect(box).toHaveAttribute('maxlength', String(MAX_MESSAGE_LENGTH));
    await user.type(box, '  book a visit  {Enter}');
    await waitFor(() => expect(onSend).toHaveBeenCalledWith('book a visit'));
    await waitFor(() => expect(box).toHaveValue(''));
  });

  it('adds a line on Shift+Enter instead of sending', async () => {
    const { user, box, onSend } = renderComposer();
    await user.type(box, 'line one{Shift>}{Enter}{/Shift}line two');
    expect(box).toHaveValue('line one\nline two');
    expect(onSend).not.toHaveBeenCalled();
  });

  it('does not send an empty or blank message', async () => {
    const { user, box, onSend } = renderComposer();
    await user.type(box, '{Enter}');
    await user.type(box, '   {Enter}');
    expect(onSend).not.toHaveBeenCalled();
    expect(view.logError).not.toHaveBeenCalled();
  });

  it('swaps the voice button for Send once there is text, and sends from it', async () => {
    const { user, box, onSend } = renderComposer();
    expect(screen.getByRole('button', { name: 'Voice message' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Send' })).not.toBeInTheDocument();
    await user.type(box, 'hello');
    expect(screen.queryByRole('button', { name: 'Voice message' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(onSend).toHaveBeenCalledWith('hello'));
  });

  it('explains the buttons that are not part of the demo', async () => {
    const { user, onUnavailable } = renderComposer();
    await user.click(screen.getByRole('button', { name: 'Emoji' }));
    await user.click(screen.getByRole('button', { name: 'Attach' }));
    await user.click(screen.getByRole('button', { name: 'Voice message' }));
    expect(onUnavailable).toHaveBeenCalledTimes(3);
    expect(screen.queryByRole('button', { name: 'Camera' })).not.toBeInTheDocument();
  });

  it('shows a camera on a phone until something is typed', async () => {
    view.compact = true;
    const { user, box, onUnavailable } = renderComposer();
    await user.click(screen.getByRole('button', { name: 'Camera' }));
    expect(onUnavailable).toHaveBeenCalledTimes(1);
    await user.type(box, 'x');
    expect(screen.queryByRole('button', { name: 'Camera' })).not.toBeInTheDocument();
  });

  it('logs a send that fails, from Enter and from the Send button', async () => {
    const failure = new Error('engine down');
    const onSend = vi.fn(() => {
      throw failure;
    });
    const { user, box } = renderComposer(onSend);
    await user.type(box, 'hi{Enter}');
    await waitFor(() =>
      expect(view.logError).toHaveBeenCalledWith('wa-demo: send failed', failure),
    );
    await user.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(view.logError).toHaveBeenCalledTimes(2));
  });
});
