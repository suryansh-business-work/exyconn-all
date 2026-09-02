import { defineConfig } from 'vite';
import { portalViteConfig } from '../shell/vite.shared';

/** Consumed as source by the apps; this config exists for its component tests. */
export default defineConfig(portalViteConfig(4033));
