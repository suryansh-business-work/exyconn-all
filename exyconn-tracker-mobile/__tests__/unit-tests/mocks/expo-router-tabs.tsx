import { Children, createContext, isValidElement, type ReactNode } from 'react';
import { vi } from 'vitest';

/**
 * `expo-router/tabs`. `Tabs` renders the first screen's header (from `screenOptions`), a marker
 * per `Tabs.Screen`, and the custom `tabBar` with a navigator state built from those screens.
 * `tabsNavigation` is the navigation object both receive.
 */
export const BottomTabBarHeightContext = createContext<number | undefined>(undefined);
export const BottomTabBarHeightCallbackContext = createContext<
  ((height: number) => void) | undefined
>(undefined);

export const tabsNavigation = {
  navigate: vi.fn(),
  emit: vi.fn((_event: unknown) => ({ defaultPrevented: false })),
};

interface ScreenProps {
  name: string;
  options?: { title?: string };
}

interface Route {
  key: string;
  name: string;
  params: undefined;
}

interface ScreenOptions {
  header?: () => ReactNode;
}

interface TabsProps {
  children?: ReactNode;
  tabBar?: (props: {
    state: { index: number; routes: Route[] };
    navigation: typeof tabsNavigation;
    descriptors: Record<string, unknown>;
    insets: { top: number; bottom: number; left: number; right: number };
  }) => ReactNode;
  screenOptions?:
    ScreenOptions | ((props: { route: Route; navigation: typeof tabsNavigation }) => ScreenOptions);
}

function screensOf(children: ReactNode): ScreenProps[] {
  return Children.toArray(children)
    .filter(isValidElement)
    .map((element) => element.props as ScreenProps);
}

export function Tabs({ children, tabBar, screenOptions }: Readonly<TabsProps>) {
  const screens = screensOf(children);
  const routes = screens.map((screen) => ({
    key: `${screen.name}-key`,
    name: screen.name,
    params: undefined,
  }));
  const first = routes[0];
  let options = typeof screenOptions === 'function' ? undefined : screenOptions;
  if (typeof screenOptions === 'function' && first !== undefined) {
    options = screenOptions({ route: first, navigation: tabsNavigation });
  }
  const header = options?.header;
  return (
    <div data-testid="tabs">
      {header?.()}
      {screens.map((screen) => (
        <div
          key={screen.name}
          data-testid={`tab-screen-${screen.name}`}
          data-title={screen.options?.title}
        />
      ))}
      {tabBar?.({
        state: { index: 0, routes },
        navigation: tabsNavigation,
        descriptors: {},
        insets: { top: 0, bottom: 0, left: 0, right: 0 },
      })}
    </div>
  );
}

function TabsScreen(_props: Readonly<ScreenProps>) {
  return null;
}

Tabs.Screen = TabsScreen;
