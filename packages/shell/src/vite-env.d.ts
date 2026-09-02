/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Portal GraphQL endpoint. */
  readonly VITE_GRAPHQL_URL?: string;
  /** Which micro-frontend this build is (a key of PORTAL_APPS). */
  readonly VITE_PORTAL_APP?: string;
  /** Parent domain the portal is served from; empty in local dev. */
  readonly VITE_PORTAL_DOMAIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
