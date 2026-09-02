import type { UserConfig } from 'vitest/config';
import type appsRegistry from './apps.json';

/** Registry entry describing where one micro-frontend is served and how its page is titled. */
export interface PortalAppEntry {
  subdomain: string;
  port: number;
  title: string;
  description: string;
}

/** Key of a micro-frontend in the portal app registry. */
export type PortalAppKey = keyof typeof appsRegistry;

export declare const PORTAL_APPS: Record<PortalAppKey, PortalAppEntry>;

/** Vite + Vitest config shared by every portal micro-frontend. */
export declare function portalViteConfig(app: PortalAppKey): UserConfig;
