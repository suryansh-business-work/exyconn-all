import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MESSAGE_MAX_CHARS, MessageForm } from '../../../../src/forms/message';
import { deferred } from '../../hooks/deferred';
import { renderWithProviders } from '../../test-utils';
import { failingOn } from '../unexpected';

const PLACEHOLDER = 'Write to your workspace…';

function compose(text: string): HTMLElement {
  const box = screen.getByPlaceholderText(PLACEHOLDER);
  fireEvent.change(box, { target: { value: text } });
  return box;
}

function send(): void {
  fireEvent.click(screen.getByRole('button', { name: /^Send/ }));
}

describe('MessageForm', () => {
  it('will not send an empty or blank message', () => {
    const onSend = vi.fn(() => Promise.resolve());
    renderWithProviders(<MessageForm onSend={onSend} />);
    send();
    compose('   ');
    send();
    expect(onSend).not.toHaveBeenCalled();
  });

  it('sends the message trimmed, and clears the box once the portal has it', async () => {
    const onSend = vi.fn(() => Promise.resolve());
    renderWithProviders(<MessageForm onSend={onSend} />);
    const box = compose('  Running late today  ');
    send();
    await waitFor(() => expect(onSend).toHaveBeenCalledWith('Running late today'));
    await waitFor(() => expect(box).toHaveValue(''));
  });

  it('keeps what was typed, and says why, when the send fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const cause = new Error('Messages are switched off for your workspace.');
    renderWithProviders(<MessageForm onSend={() => Promise.reject(cause)} />);
    const box = compose('Hello');
    send();
    expect(
      await screen.findByText('Messages are switched off for your workspace.'),
    ).toBeInTheDocument();
    expect(box).toHaveValue('Hello');
    expect(error).toHaveBeenCalledWith('Sending the message failed', cause);
  });

  it('falls back to a plain sentence when the failure has no reason', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    renderWithProviders(<MessageForm onSend={() => Promise.reject(new Error(''))} />);
    compose('Hello');
    send();
    expect(
      await screen.findByText(
        'Your message could not be sent. Check your connection and try again.',
      ),
    ).toBeInTheDocument();
  });

  it("stops at the portal's length limit", async () => {
    const onSend = vi.fn(() => Promise.resolve());
    renderWithProviders(<MessageForm onSend={onSend} />);
    compose('a'.repeat(MESSAGE_MAX_CHARS + 1));
    send();
    expect(
      await screen.findByText(`A message cannot be longer than ${MESSAGE_MAX_CHARS} characters.`),
    ).toBeInTheDocument();
    expect(onSend).not.toHaveBeenCalled();
  });

  it('locks the composer while the message is on its way', async () => {
    const delivery = deferred<undefined>();
    renderWithProviders(<MessageForm onSend={() => delivery.promise} />);
    compose('Hello');
    send();
    expect(await screen.findByRole('progressbar')).toBeInTheDocument();
    await act(async () => {
      delivery.resolve(undefined);
      await delivery.promise;
    });
    await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());
  });

  it('logs a failure it did not expect while handling a failed send', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const failure = new Error('Translations unavailable');
    renderWithProviders(<MessageForm onSend={() => Promise.reject(new Error('offline'))} />, {
      onMissing: failingOn(
        'Your message could not be sent. Check your connection and try again.',
        failure,
      ),
    });
    compose('Hello');
    send();
    await waitFor(() => expect(error).toHaveBeenCalledWith('Sending the message failed', failure));
  });
});
