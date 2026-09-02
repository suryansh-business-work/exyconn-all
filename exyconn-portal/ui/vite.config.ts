import { defineConfig } from 'vitest/config';
import { portalViteConfig } from '../../packages/shell/vite.shared';

export default defineConfig(portalViteConfig(4003));
