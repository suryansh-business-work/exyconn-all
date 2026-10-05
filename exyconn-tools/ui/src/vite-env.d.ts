/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** The portal's visitor chat socket, e.g. wss://portal-server.exyconn.com/chat/ws. */
  readonly VITE_CHAT_SOCKET_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
