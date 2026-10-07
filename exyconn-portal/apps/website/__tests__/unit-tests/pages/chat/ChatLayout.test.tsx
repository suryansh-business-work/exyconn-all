import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { tokenStore } from '@exyconn/shell/auth/tokenStore';
import { ChatLayout } from '../../../../src/pages/chat';
import { useChatConsole, useChatFrames } from '../../../../src/pages/chat/chat.context';
import { chatSocketUrl } from '../../../../src/pages/chat/socket/chatSocketUrl';
import type {
  ChatConnection,
  FrameListener,
  StaffClientFrame,
} from '../../../../src/pages/chat/socket/chatSocket.types';
import { renderWithProviders } from '../../test-utils';

const STORAGE_KEY = 'exyconn.website.chat-alerts';

interface FakeClient {
  url: () => string;
  token: () => string | null;
  state: ChatConnection;
  start: () => void;
  stop: () => void;
  send: (frame: StaffClientFrame) => boolean;
  frames: Set<FrameListener>;
  setState: (next: ChatConnection) => void;
}

const sockets = vi.hoisted(() => ({ clients: [] as unknown[] }));

/** The real client opens a WebSocket; this one records calls and lets the test drive it. */
vi.mock('../../../../src/pages/chat/socket/ChatSocketClient', () => ({
  ChatSocketClient: class {
    state: ChatConnection = 'connecting';
    readonly frames = new Set<FrameListener>();
    readonly stateListeners = new Set<() => void>();
    readonly start = vi.fn();
    readonly stop = vi.fn();
    readonly send = vi.fn(() => true);

    constructor(
      readonly url: () => string,
      readonly token: () => string | null,
    ) {
      sockets.clients.push(this);
    }

    readonly onStateChange = (listener: () => void) => {
      this.stateListeners.add(listener);
      return () => {
        this.stateListeners.delete(listener);
      };
    };

    subscribe(listener: FrameListener) {
      this.frames.add(listener);
      return () => {
        this.frames.delete(listener);
      };
    }

    setState(next: ChatConnection) {
      this.state = next;
      this.stateListeners.forEach((listener) => listener());
    }
  },
}));

const client = () => sockets.clients[0] as FakeClient;

/** A chat page inside the layout: shows what the console offers and pokes at it. */
function ConsoleProbe() {
  const { connection, prefs, send, setPrefs } = useChatConsole();
  const [frames, setFrames] = useState<string[]>([]);
  const [sent, setSent] = useState('');
  useChatFrames((frame) => setFrames((previous) => [...previous, frame.t]));
  return (
    <div>
      <output aria-label="connection">{connection}</output>
      <output aria-label="prefs">{JSON.stringify(prefs)}</output>
      <output aria-label="frames">{frames.join(',')}</output>
      <output aria-label="sent">{sent}</output>
      <button type="button" onClick={() => setSent(String(send({ t: 'read', sessionId: 's1' })))}>
        Send read
      </button>
      <button type="button" onClick={() => setPrefs({ ...prefs, sound: false })}>
        Mute
      </button>
    </div>
  );
}

const renderLayout = () =>
  renderWithProviders(
    <Routes>
      <Route element={<ChatLayout />}>
        <Route path="/" element={<ConsoleProbe />} />
      </Route>
    </Routes>,
  );

const shown = (label: string) => screen.getByLabelText(label).textContent;

describe('ChatLayout', () => {
  beforeEach(() => {
    sockets.clients.length = 0;
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('opens one socket to the chat endpoint, signed in with the stored token', () => {
    const token = ['session', 'token', String(Date.now())].join('-');
    vi.spyOn(tokenStore, 'get').mockReturnValue(token);
    renderLayout();

    expect(sockets.clients).toHaveLength(1);
    expect(client().url).toBe(chatSocketUrl);
    expect(client().token()).toBe(token);
    expect(client().start).toHaveBeenCalledTimes(1);
  });

  it('closes the socket when the chat screens are left', () => {
    const { unmount } = renderLayout();
    unmount();
    expect(client().stop).toHaveBeenCalledTimes(1);
  });

  it('follows the connection state of the socket', () => {
    renderLayout();
    expect(shown('connection')).toBe('connecting');

    act(() => client().setState('ready'));
    expect(shown('connection')).toBe('ready');

    act(() => client().setState('offline'));
    expect(shown('connection')).toBe('offline');
  });

  it('sends frames through the socket and reports whether they went', async () => {
    renderLayout();
    await userEvent.click(screen.getByRole('button', { name: 'Send read' }));

    expect(client().send).toHaveBeenCalledWith({ t: 'read', sessionId: 's1' });
    expect(shown('sent')).toBe('true');
  });

  it('hands every server frame to the pages that listen', () => {
    renderLayout();
    act(() => client().frames.forEach((listener) => listener({ t: 'pong' })));
    expect(shown('frames')).toBe('pong');
  });

  it('starts from the alert choices saved in this browser and saves changes', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ desktop: true }));
    renderLayout();
    expect(JSON.parse(shown('prefs') ?? '')).toEqual({ sound: true, desktop: true, animate: true });

    await userEvent.click(screen.getByRole('button', { name: 'Mute' }));

    const muted = { sound: false, desktop: true, animate: true };
    expect(JSON.parse(shown('prefs') ?? '')).toEqual(muted);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '')).toEqual(muted);
  });
});
