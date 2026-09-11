import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { TamaguiProvider, Theme } from 'tamagui';
import type { Branding, ThemeMode } from '@exyconn/tracker-core';
import { brandColors, resolveScheme, type BrandColors } from './brand';
import config from './tamagui.config';

interface BrandContextValue extends BrandColors {
  scheme: 'light' | 'dark';
  branding: Branding | null;
  /** How much of the plain ground is painted over the brand gradient: 1 is solid. */
  groundOpacity: number;
}

const BrandContext = createContext<BrandContextValue | null>(null);

interface Props {
  branding: Branding | null;
  themeMode: ThemeMode;
  groundOpacity: number;
  children: ReactNode;
}

/**
 * Paints the app: Tamagui's light or dark chrome (the employee's choice, else the OS and the
 * brand's own background, as the desktop decides), and the portal brand's accent for everything
 * that should carry the workspace's colour. Keyed on exactly what it reads, so the once-a-second
 * state republish does not rebuild the theme.
 */
export function BrandProvider({ branding, themeMode, groundOpacity, children }: Readonly<Props>) {
  const systemPrefersDark = useColorScheme() === 'dark';
  const value = useMemo<BrandContextValue>(() => {
    const colors = brandColors(branding);
    return {
      ...colors,
      scheme: resolveScheme(themeMode, colors.background, systemPrefersDark),
      branding,
      groundOpacity,
    };
  }, [branding, themeMode, systemPrefersDark, groundOpacity]);

  return (
    <TamaguiProvider config={config} defaultTheme={value.scheme}>
      <Theme name={value.scheme}>
        <BrandContext.Provider value={value}>{children}</BrandContext.Provider>
      </Theme>
    </TamaguiProvider>
  );
}

export function useBrand(): BrandContextValue {
  const value = useContext(BrandContext);
  if (value === null) {
    throw new Error('useBrand must be used inside BrandProvider.');
  }
  return value;
}
