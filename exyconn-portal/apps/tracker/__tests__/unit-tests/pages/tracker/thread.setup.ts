import type { Mock } from 'vitest';
import { queryResult } from './tracker.fixtures';

/** The thread's generated hooks, the calls they hand back, and whether a send is in flight. */
export interface ThreadState {
  query: Mock;
  markReadHook: Mock;
  sendHook: Mock;
  markRead: Mock;
  send: Mock;
  sending: boolean;
}

/** Resets every mock: no messages yet, read-marking and sending both succeed. */
export function resetThread(state: ThreadState, messages: object[] = []) {
  state.sending = false;
  state.markRead.mockReset().mockResolvedValue({ data: {} });
  state.send.mockReset().mockResolvedValue({ data: {} });
  state.markReadHook.mockReset().mockReturnValue([state.markRead]);
  state.sendHook.mockReset().mockImplementation(() => [state.send, { loading: state.sending }]);
  state.query.mockReset().mockReturnValue(queryResult({ trackerMessageThread: messages }));
}
