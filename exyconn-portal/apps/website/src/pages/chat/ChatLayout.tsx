import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Outlet } from 'react-router-dom';
import { tokenStore } from '@exyconn/shell/auth/tokenStore';
import { ChatConsoleContext, type ChatConsole } from './chat.context';
import { ChatSocketClient } from './socket/ChatSocketClient';
import { chatSocketUrl } from './socket/chatSocketUrl';
import {
  readChatAlertPrefs,
  saveChatAlertPrefs,
  type ChatAlertPrefs,
} from './alerts/chatAlertPrefs';
import { ChatAlerts } from './alerts/ChatAlerts';

/**
 * Wraps every Website > Chatbot screen so they share one chat socket per tab: moving from the
 * session list to a conversation and back keeps the same connection, and the new-message
 * chime rings on whichever of them is open.
 */
export function ChatLayout() {
  const [client] = useState(() => new ChatSocketClient(chatSocketUrl, () => tokenStore.get()));
  useEffect(() => {
    client.start();
    return () => client.stop();
  }, [client]);
  const connection = useSyncExternalStore(client.onStateChange, () => client.state);

  const [prefs, setPrefs] = useState<ChatAlertPrefs>(readChatAlertPrefs);
  const savePrefs = useCallback((next: ChatAlertPrefs) => {
    setPrefs(next);
    saveChatAlertPrefs(next);
  }, []);

  const send = useCallback<ChatConsole['send']>((frame) => client.send(frame), [client]);
  const subscribe = useCallback<ChatConsole['subscribe']>(
    (listener) => client.subscribe(listener),
    [client],
  );
  const value = useMemo<ChatConsole>(
    () => ({ connection, send, subscribe, prefs, setPrefs: savePrefs }),
    [connection, send, subscribe, prefs, savePrefs],
  );

  return (
    <ChatConsoleContext.Provider value={value}>
      <ChatAlerts />
      <Outlet />
    </ChatConsoleContext.Provider>
  );
}
