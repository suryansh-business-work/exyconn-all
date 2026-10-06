/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * The visitor chat loader, e.g. https://exyconn.com/embed/chat.js. Only index.html reads it
   * (`%VITE_CHAT_EMBED_URL%`): the loader opens the chat in an iframe served by the website.
   */
  readonly VITE_CHAT_EMBED_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
