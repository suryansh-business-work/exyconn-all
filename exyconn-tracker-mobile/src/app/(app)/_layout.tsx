import { Drawer } from 'expo-router/drawer';
import { AppHeader } from '../../components/shell/AppHeader';
import { NavDrawer } from '../../components/shell/NavDrawer';
import { useTrackerState } from '../../hooks/useTrackerState';
import { NAV_ITEMS, titleOf, type Section } from '../../navigation/sections';

/**
 * The signed-in shell: a header with the recording indicator on every page, and the drawer
 * holding the desktop's five sections. Every screen reads the one live tracker state.
 */
export default function AppLayout() {
  const state = useTrackerState();
  const status = state?.status ?? 'idle';

  return (
    <Drawer
      drawerContent={(props) => (
        <NavDrawer
          {...props}
          user={state?.user ?? null}
          unreadMessages={state?.unreadMessages ?? 0}
        />
      )}
      screenOptions={({ route }) => ({
        header: ({ navigation }) => (
          <AppHeader
            title={titleOf(route.name as Section)}
            status={status}
            onOpenMenu={() => navigation.openDrawer()}
          />
        ),
      })}
    >
      {NAV_ITEMS.map((item) => (
        <Drawer.Screen key={item.id} name={item.id} options={{ title: item.label }} />
      ))}
    </Drawer>
  );
}
