import { useEffect, type EffectCallback, type ReactNode } from 'react';
import { vi } from 'vitest';

/**
 * `expo-router`. One shared `router` (also what `useRouter()` returns) whose methods are spies:
 * `expect(router.push).toHaveBeenCalledWith('/report')`. Params and pathname are spies too:
 * `vi.mocked(useLocalSearchParams).mockReturnValue({ start: '…' })`. The focus effect runs on
 * mount, as it does for the screen a test renders.
 */
export const router = {
  push: vi.fn(),
  replace: vi.fn(),
  navigate: vi.fn(),
  back: vi.fn(),
  canGoBack: vi.fn(() => false),
  setParams: vi.fn(),
  dismiss: vi.fn(),
  canDismiss: vi.fn(() => false),
};

export const useRouter = () => router;
export const useLocalSearchParams = vi.fn(
  (): Record<string, string | string[] | undefined> => ({}),
);
export const useGlobalSearchParams = useLocalSearchParams;
export const usePathname = vi.fn(() => '/');
export const useSegments = vi.fn((): string[] => []);

export function useFocusEffect(effect: EffectCallback): void {
  useEffect(effect, [effect]);
}

/** Where a screen redirected to, readable as `data-href`. */
export function Redirect({ href }: Readonly<{ href: string | { pathname: string } }>) {
  const target = typeof href === 'string' ? href : href.pathname;
  return <div data-testid="redirect" data-href={target} />;
}

interface StackProps {
  children?: ReactNode;
  screenOptions?: unknown;
}

/** Renders a marker per screen the guards admit: `getByTestId('stack-screen-login')`. */
export function Stack({ children }: Readonly<StackProps>) {
  return <div data-testid="stack">{children}</div>;
}

function StackScreen({ name }: Readonly<{ name: string; options?: unknown }>) {
  return <div data-testid={`stack-screen-${name}`} />;
}

function StackProtected({ guard, children }: Readonly<{ guard: boolean; children?: ReactNode }>) {
  return guard ? <>{children}</> : null;
}

Stack.Screen = StackScreen;
Stack.Protected = StackProtected;
