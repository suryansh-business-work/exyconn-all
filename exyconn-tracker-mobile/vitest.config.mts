import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const MOCKS = fileURLToPath(new URL('./__tests__/unit-tests/mocks/', import.meta.url));
const SRC = fileURLToPath(new URL('./src/', import.meta.url));

/**
 * Native modules have no JS implementation off a device, so each resolves to a stub under
 * __tests__/unit-tests/mocks. `react-native` (and the `react-native-web` Tamagui's web build
 * imports) becomes plain DOM elements; the stubs' spies are reset after every test.
 */
const NATIVE_STUBS: [RegExp, string][] = [
  [/^react-native$/, 'react-native/index.tsx'],
  [/^react-native-web$/, 'react-native/index.tsx'],
  [/^react-native-svg$/, 'react-native-svg.tsx'],
  [/^react-native-webview$/, 'react-native-webview.tsx'],
  [/^react-native-safe-area-context$/, 'safe-area-context.tsx'],
  [/^react-native-gesture-handler$/, 'gesture-handler.tsx'],
  [/^@react-native-community\/datetimepicker$/, 'datetimepicker.tsx'],
  [/^@expo\/vector-icons(\/.*)?$/, 'vector-icons.tsx'],
  [/^@expo-google-fonts\/inter(\/.*)?$/, 'google-fonts-inter.ts'],
  [/^expo$/, 'expo.ts'],
  [/^expo-application$/, 'expo-application.ts'],
  [/^expo-constants$/, 'expo-constants.ts'],
  [/^expo-crypto$/, 'expo-crypto.ts'],
  [/^expo-device$/, 'expo-device.ts'],
  [/^expo-file-system$/, 'expo-file-system.ts'],
  [/^expo-font$/, 'expo-font.ts'],
  [/^expo-image$/, 'expo-image.tsx'],
  [/^expo-localization$/, 'expo-localization.ts'],
  [/^expo-notifications$/, 'expo-notifications.ts'],
  [/^expo-router$/, 'expo-router.tsx'],
  [/^expo-router\/tabs$/, 'expo-router-tabs.tsx'],
  [/^expo-secure-store$/, 'expo-secure-store.ts'],
  [/^expo-sharing$/, 'expo-sharing.ts'],
  [/^expo-status-bar$/, 'expo-status-bar.tsx'],
];

/**
 * Pure logic (`*.test.ts`) runs in node; components and hooks (`*.test.tsx`) in jsdom, where
 * Tamagui renders its web build. A `.test.ts` that needs the DOM opts in with a
 * `// @vitest-environment jsdom` comment.
 */
export default defineConfig({
  resolve: {
    alias: [
      ...NATIVE_STUBS.map(([find, file]) => ({ find, replacement: `${MOCKS}${file}` })),
      // The JS-driven animation driver needs react-native's Animated; CSS animations do not.
      { find: /^@tamagui\/config\/v5-rn$/, replacement: '@tamagui/config/v5-css' },
      { find: /^@\//, replacement: SRC },
    ],
    // One React for the app, Tamagui and the workspace packages it renders from source.
    dedupe: ['react', 'react-dom'],
  },
  test: {
    env: { TAMAGUI_TARGET: 'web' },
    setupFiles: ['__tests__/unit-tests/setup/native.ts'],
    // Inlined so their `react-native-web` imports go through the alias above.
    server: { deps: { inline: [/tamagui/] } },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/*.{test,cy}.{ts,tsx}', '**/graphql/generated/**'],
    },
    projects: [
      {
        extends: true,
        test: { name: 'node', environment: 'node', include: ['__tests__/unit-tests/**/*.test.ts'] },
      },
      {
        extends: true,
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: ['__tests__/unit-tests/**/*.test.tsx'],
          setupFiles: ['__tests__/unit-tests/setup/dom.ts'],
        },
      },
    ],
  },
});
