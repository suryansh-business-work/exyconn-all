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

/**
 * The service-worker registration the PWA plugin generates for a BUILT app. It does not
 * exist in dev or under the test runner, which is why `usePwaUpdate` imports it dynamically
 * and shrugs off the failure.
 */
declare module 'virtual:pwa-register' {
  export interface RegisterSWOptions {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegisteredSW?: (url: string, registration: ServiceWorkerRegistration | undefined) => void;
    onRegisterError?: (error: unknown) => void;
  }
  export function registerSW(options?: RegisterSWOptions): (reload?: boolean) => Promise<void>;
}
