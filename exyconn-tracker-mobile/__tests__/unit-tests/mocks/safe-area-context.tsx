import type { ReactNode } from 'react';
import { vi } from 'vitest';

/** `react-native-safe-area-context`: a phone with a notch and a home indicator. */
export const useSafeAreaInsets = vi.fn(() => ({ top: 47, bottom: 34, left: 0, right: 0 }));

export function SafeAreaProvider({ children }: Readonly<{ children?: ReactNode }>) {
  return <>{children}</>;
}

export const SafeAreaView = SafeAreaProvider;
