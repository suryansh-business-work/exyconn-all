import { defaultConfig } from '@tamagui/config/v5';
import { animations } from '@tamagui/config/v5-rn';
import { createTamagui } from 'tamagui';
import { CHROME, type Chrome } from './palette';

/** Tamagui's base theme with the tracker's chrome laid over it, plus named keys for it. */
function withChrome(base: typeof defaultConfig.themes.light, chrome: Chrome) {
  return {
    ...base,
    background: chrome.app,
    backgroundStrong: chrome.paper,
    color: chrome.ink,
    borderColor: chrome.hairline,
    placeholderColor: chrome.muted,
    app: chrome.app,
    paper: chrome.paper,
    ink: chrome.ink,
    muted: chrome.muted,
    hairline: chrome.hairline,
    success: chrome.success,
    warning: chrome.warning,
    error: chrome.error,
  };
}

/**
 * Only `light` and `dark`: the app has no sub-themes, and the brand accent is applied from the
 * portal's branding at runtime (see BrandProvider), not baked in here.
 */
const config = createTamagui({
  ...defaultConfig,
  animations,
  settings: {
    ...defaultConfig.settings,
    // Full prop names read better than two-letter shorthands in a codebase this size.
    onlyAllowShorthands: false,
    // The brand accent is a raw colour from the portal, known only at runtime. Hex literals are
    // still confined to the design system's token file (see palette.ts).
    allowedStyleValues: false,
    // React Native's flex rules, not the web's: every layout here is a native one.
    styleCompat: 'react-native',
  },
  themes: {
    light: withChrome(defaultConfig.themes.light, CHROME.light),
    dark: withChrome(defaultConfig.themes.dark, CHROME.dark),
  },
});

export type AppConfig = typeof config;

declare module 'tamagui' {
  // Tamagui's typing hook: an empty interface merged over its own is how the config reaches
  // every component's props.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config;
