import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ChatReplyClosed,
  ChatReplyForm,
  type SendChatReply,
} from '../../../../../../src/pages/chat/forms/chat-reply';
import { renderWithProviders } from '../../../../test-utils';

const voice = vi.hoisted(() => ({
  supported: true,
  recording: false,
  seconds: 0,
  start: vi.fn(),
  stop: vi.fn(),
  cancel: vi.fn(),
}));

vi.mock('@exyconn/shell/utils/file', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/utils/file')>()),
  fileToDataUrl: (file: File) => Promise.resolve(`data:${file.type};base64,AAAA`),
}));
vi.mock('../../../../../../src/pages/chat/forms/chat-reply/useVoiceRecorder', () => ({
  voiceNotesSupported: () => voice.supported,
  useVoiceRecorder: () => voice,
}));

const onSend = vi.fn<SendChatReply>();
const onTyping = vi.fn<(on: boolean) => void>();

function renderForm() {
  return renderWithProviders(<ChatReplyForm maxUploadMb={5} onSend={onSend} onTyping={onTyping} />);
}

const reply = () => screen.getByLabelText('Reply');

function attach(container: HTMLElement, ...names: string[]) {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error('No file input');
  const files = names.map((name) => new File(['x'], name, { type: 'image/png' }));
  fireEvent.change(input, { target: { files } });
}

describe('ChatReplyForm', () => {
  beforeEach(() => {
    onSend.mockReset().mockReturnValue(true);
    onTyping.mockReset();
    Object.assign(voice, { supported: true, recording: false, seconds: 0 });
    voice.start.mockReset();
  });

  it('sends the trimmed reply on Enter, clears the box and says typing stopped', async () => {
    renderForm();
    await userEvent.type(reply(), '  Hello Asha  {Enter}');

    await waitFor(() => expect(onSend).toHaveBeenCalledWith('Hello Asha', []));
    expect(reply()).toHaveValue('');
    expect(onTyping.mock.calls).toEqual([[true], [false]]);
  });

  it('starts a new line on Shift+Enter instead of sending', async () => {
    renderForm();
    await userEvent.type(reply(), 'Line one{Shift>}{Enter}{/Shift}Line two');

    expect(reply()).toHaveValue('Line one\nLine two');
    expect(onSend).not.toHaveBeenCalled();
  });

  it('does not send while an input method is still composing', () => {
    renderForm();
    fireEvent.keyDown(reply(), { key: 'Enter', isComposing: true });

    expect(onSend).not.toHaveBeenCalled();
    expect(onTyping).toHaveBeenCalledWith(true);
  });

  it('sends nothing when there is neither text nor a file', async () => {
    renderForm();
    await userEvent.type(reply(), '   ');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(onSend).not.toHaveBeenCalled();
  });

  it('keeps what was written when the reply could not go', async () => {
    onSend.mockReturnValue(false);
    renderForm();
    await userEvent.type(reply(), 'Still there?');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(onSend).toHaveBeenCalledTimes(1));
    expect(reply()).toHaveValue('Still there?');
  });

  it('refuses a reply over 2000 characters', async () => {
    renderForm();
    fireEvent.change(reply(), { target: { value: 'x'.repeat(2001) } });

    expect(await screen.findByText('Keep the message under 2000 characters.')).toBeInTheDocument();
    fireEvent.keyDown(reply(), { key: 'Enter' });
    await waitFor(() => expect(onSend).not.toHaveBeenCalled());
  });

  it('sends pictures on their own and clears them afterwards', async () => {
    const { container } = renderForm();
    attach(container, 'photo.png');
    expect(await screen.findByText(/^photo\.png ·/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() =>
      expect(onSend).toHaveBeenCalledWith('', [
        { name: 'photo.png', data: 'data:image/png;base64,AAAA' },
      ]),
    );
    await waitFor(() => expect(screen.queryByText(/^photo\.png ·/)).not.toBeInTheDocument());
  });

  it('stops offering attachments once four files are waiting', async () => {
    const { container } = renderForm();
    attach(container, '1.png', '2.png', '3.png', '4.png');

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Attach a picture or video' })).toHaveClass(
        'Mui-disabled',
      ),
    );
    expect(screen.getByRole('button', { name: 'Record a voice note' })).toBeDisabled();
  });

  it('ignores a file picker that hands back no file list', () => {
    const { container } = renderForm();
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) throw new Error('No file input');
    fireEvent.change(input, { target: { files: null } });

    expect(screen.queryByText(/\.png ·/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Attach a picture or video' })).not.toHaveClass(
      'Mui-disabled',
    );
  });

  it('records a voice note where the browser can', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Record a voice note' }));
    expect(voice.start).toHaveBeenCalledTimes(1);
  });

  it('offers no voice notes where the browser cannot record', () => {
    voice.supported = false;
    renderForm();
    expect(screen.getByRole('button', { name: 'Record a voice note' })).toBeDisabled();
  });

  it('swaps the composer for the recording controls while a note records', async () => {
    Object.assign(voice, { recording: true, seconds: 7 });
    voice.stop.mockReset();
    voice.cancel.mockReset();
    renderForm();

    expect(screen.getByRole('status')).toHaveTextContent('Recording 0:07');
    expect(screen.queryByLabelText('Reply')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Stop and attach' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(voice.stop).toHaveBeenCalledTimes(1);
    expect(voice.cancel).toHaveBeenCalledTimes(1);
  });

  it('says why when sending throws', async () => {
    onSend.mockImplementation(() => {
      throw new Error('The socket is closed');
    });
    renderForm();
    await userEvent.type(reply(), 'Hi{Enter}');

    expect(await screen.findByText('The socket is closed')).toBeInTheDocument();
  });
});

describe('ChatReplyClosed', () => {
  it('says replies are off once the chat has ended', () => {
    renderWithProviders(<ChatReplyClosed />);
    expect(
      screen.getByText('This chat is closed, so replies are switched off.'),
    ).toBeInTheDocument();
  });
});
