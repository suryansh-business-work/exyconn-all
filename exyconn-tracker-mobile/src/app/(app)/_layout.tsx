import { Tabs } from 'expo-router/tabs';
import { AppHeader } from '../../components/shell/AppHeader';
import { TabBar } from '../../components/shell/TabBar';
import { useNotificationRouting } from '../../hooks/useNotificationRouting';
import { useTrackerState } from '../../hooks/useTrackerState';
import { NAV_ITEMS, titleOf, type Section } from '../../navigation/sections';

/** Screens are transparent: the root layout's ground paints behind them. */
const CLEAR_SCENE = { backgroundColor: 'transparent' } as const;

/**
 * The signed-in shell: the big-title header on every page, and the floating tab bar holding the
 * desktop's five sections. Every screen reads the one live tracker state.
 */
export default function AppLayout() {
  const state = useTrackerState();
  useNotificationRouting();
  const status = state?.status ?? 'idle';

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} unreadMessages={state?.unreadMessages ?? 0} />}
      screenOptions={({ route, navigation }) => ({
        sceneStyle: CLEAR_SCENE,
        header: () => (
          <AppHeader
            title={titleOf(route.name as Section)}
            status={status}
            user={state?.user ?? null}
            themeMode={state?.preferences.themeMode ?? 'system'}
            onOpenAccount={() => navigation.navigate('settings')}
          />
        ),
      })}
    >
      {NAV_ITEMS.map((item) => (
        <Tabs.Screen key={item.id} name={item.id} options={{ title: item.label }} />
      ))}
    </Tabs>
  );
}

export { ScreenErrorBoundary as ErrorBoundary } from '../../components/shell/ScreenErrorBoundary';
