import type { ComponentProps } from 'react';
import { Tabs } from 'expo-router/tabs';
import { useT } from '@exyconn/i18n';
import { AppHeader } from '../../components/shell/AppHeader';
import { TabBar } from '../../components/shell/TabBar';
import { trackingStatusLabel } from '../../components/shell/TrackingPulse';
import { useNotificationRouting } from '../../hooks/useNotificationRouting';
import { useStatusMessage } from '../../hooks/useStatusMessage';
import { useTrackerState } from '../../hooks/useTrackerState';
import { NAV_ITEMS, titleOf, type Section } from '../../navigation/sections';

/** Screens are transparent: the root layout's ground paints behind them. */
const CLEAR_SCENE = { backgroundColor: 'transparent' } as const;

type TabBarProps = Omit<ComponentProps<typeof TabBar>, 'unreadMessages'>;
type HeaderProps = Pick<ComponentProps<typeof AppHeader>, 'status' | 'user' | 'themeMode'>;
type HeaderRoute = {
  route: { name: string };
  navigation: { navigate: (name: 'settings') => void };
};

/** The tab bar, told how many messages are unread. */
const tabBarFor = (unreadMessages: number) => (props: Readonly<TabBarProps>) => (
  <TabBar {...props} unreadMessages={unreadMessages} />
);

/** The options of one screen: a clear scene and the header carrying the shell's state. */
const screenOptionsFor =
  (t: ReturnType<typeof useT>, shell: Readonly<HeaderProps>) =>
  ({ route, navigation }: Readonly<HeaderRoute>) => ({
    sceneStyle: CLEAR_SCENE,
    header: () => (
      <AppHeader
        title={t(titleOf(route.name as Section))}
        {...shell}
        onOpenAccount={() => navigation.navigate('settings')}
      />
    ),
  });

/**
 * The signed-in shell: the big-title header on every page, and the floating tab bar holding the
 * desktop's five sections. Every screen reads the one live tracker state.
 */
export default function AppLayout() {
  const t = useT();
  const state = useTrackerState();
  useNotificationRouting();
  const status = state?.status ?? 'idle';
  // Once here, not in each tab's header: every mounted header would say it again.
  useStatusMessage(t(trackingStatusLabel(status)));

  const screenOptions = screenOptionsFor(t, {
    status,
    user: state?.user ?? null,
    themeMode: state?.preferences.themeMode ?? 'system',
  });

  return (
    <Tabs tabBar={tabBarFor(state?.unreadMessages ?? 0)} screenOptions={screenOptions}>
      {NAV_ITEMS.map((item) => (
        <Tabs.Screen key={item.id} name={item.id} options={{ title: t(item.label) }} />
      ))}
    </Tabs>
  );
}

export { ScreenErrorBoundary as ErrorBoundary } from '../../components/shell/ScreenErrorBoundary';
