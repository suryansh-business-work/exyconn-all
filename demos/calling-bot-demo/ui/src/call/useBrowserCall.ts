import { useCallback, useEffect, useRef, useState } from 'react';
import { useT } from '@exyconn/i18n';
import {
  CallingBotChannel,
  useStartCallingBotCallMutation,
  type CallingBotTurnRole,
} from '@exyconn/shell/graphql/generated';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { openMicrophone, type Microphone } from '../audio/microphone';
import { PcmPlayer } from '../audio/player';
import type { CallPhase, TranscriptLine } from './transcript';

/** What the voice server says on a browser call, besides the bot's audio (binary frames). */
type ServerEvent =
  | { type: 'turn'; role: CallingBotTurnRole; text: string }
  | { type: 'clear' }
  | { type: 'ended'; reason: string };

interface Session {
  socket: WebSocket | null;
  microphone: Microphone;
  player: PcmPlayer;
}

/**
 * A call with the bot from this browser: the microphone and speaker open on the caller's click,
 * then the call is asked for and its audio runs over the voice server's socket.
 */
export function useBrowserCall() {
  const t = useT();
  const [startCall] = useStartCallingBotCallMutation();
  const [phase, setPhase] = useState<CallPhase>('idle');
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const session = useRef<Session | null>(null);
  const lineCount = useRef(0);

  const close = useCallback(() => {
    const current = session.current;
    session.current = null;
    current?.microphone.stop();
    current?.player.close();
    if (current?.socket && current.socket.readyState <= WebSocket.OPEN) {
      current.socket.close();
    }
  }, []);

  const finish = useCallback(
    (message: string | null) => {
      close();
      setPhase('ended');
      setError(message);
    },
    [close],
  );

  const handle = useCallback(
    (event: ServerEvent, player: PcmPlayer) => {
      if (event.type === 'clear') {
        player.clear();
      } else if (event.type === 'turn') {
        lineCount.current += 1;
        const line = { key: `line-${lineCount.current}`, role: event.role, text: event.text };
        setLines((previous) => [...previous, line]);
      } else {
        finish(null);
      }
    },
    [finish],
  );

  const connect = useCallback(
    (url: string, current: Session) => {
      const socket = new WebSocket(url);
      socket.binaryType = 'arraybuffer';
      current.socket = socket;
      socket.onopen = () => {
        setPhase('live');
        setStartedAt(Date.now());
      };
      socket.onmessage = (message: MessageEvent<ArrayBuffer | string>) => {
        if (typeof message.data === 'string') {
          handle(JSON.parse(message.data) as ServerEvent, current.player);
        } else {
          current.player.play(message.data);
        }
      };
      socket.onclose = () => finish(null);
      socket.onerror = () => finish(t('The call dropped. Try again.'));
    },
    [finish, handle, t],
  );

  const start = useCallback(async () => {
    setError(null);
    setLines([]);
    setStartedAt(null);
    setPhase('connecting');
    const player = new PcmPlayer();
    try {
      const microphone = await openMicrophone((frame) => {
        if (session.current?.socket?.readyState === WebSocket.OPEN) {
          session.current.socket.send(frame);
        }
      });
      const current: Session = { socket: null, microphone, player };
      session.current = current;
      const { data } = await startCall({
        variables: { input: { channel: CallingBotChannel.Browser } },
      });
      const url = data?.startCallingBotCall.socketUrl;
      if (!url) {
        throw new Error(t('The call could not be started.'));
      }
      connect(url, current);
    } catch (failure) {
      player.close();
      finish(errorMessage(failure, t('Allow the microphone, then try again.')));
    }
  }, [connect, finish, startCall, t]);

  const hangUp = useCallback(() => {
    const socket = session.current?.socket;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'hangup' }));
    }
    finish(null);
  }, [finish]);

  // Leaving the page ends the call: the microphone must never stay open behind it.
  useEffect(() => close, [close]);

  return { phase, lines, error, startedAt, start, hangUp };
}
