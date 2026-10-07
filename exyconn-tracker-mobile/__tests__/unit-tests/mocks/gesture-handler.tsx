import type { ReactNode } from 'react';

/** `react-native-gesture-handler`: the root view is a plain wrapper under test. */
export function GestureHandlerRootView({
  children,
}: Readonly<{ children?: ReactNode; style?: unknown }>) {
  return <div data-testid="gesture-root">{children}</div>;
}
