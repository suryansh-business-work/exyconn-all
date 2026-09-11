import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { Box } from '@exyconn/ui';
import { LogErrorBoundary } from '@exyconn/logger/react';
import type { TrackerState } from '@shared/types';
import AppHeader from './components/AppHeader';
import CrashFallback from './components/CrashFallback';
import NavDrawer from './components/NavDrawer';
import DashboardScreen from './screens/DashboardScreen';
import MessagesScreen from './screens/MessagesScreen';
import MyReportScreen from './screens/MyReportScreen';
import OffComputerScreen from './screens/OffComputerScreen';
import SettingsScreen from './screens/SettingsScreen';
import { NAV_ITEMS, type Section } from './sections';
import { logger } from './logger';

interface SectionProps {
  section: Section;
  state: TrackerState;
}

/** Renders the pane for the selected section (module scope — never nested in AppShell). */
function SectionView({ section, state }: Readonly<SectionProps>): ReactElement {
  if (section === 'report') {
    return <MyReportScreen timezone={state.timezone} />;
  }
  if (section === 'messages') {
    return <MessagesScreen timezone={state.timezone} />;
  }
  if (section === 'off-computer') {
    return <OffComputerScreen projects={state.projects} timezone={state.timezone} />;
  }
  if (section === 'settings') {
    return (
      <SettingsScreen
        settings={state.settings}
        branding={state.branding}
        timezone={state.timezone}
        preferences={state.preferences}
        workProfile={state.workProfile}
      />
    );
  }
  return <DashboardScreen state={state} />;
}

function titleOf(section: Section): string {
  const item = NAV_ITEMS.find((entry) => entry.id === section);
  return item?.label ?? '';
}

interface Props {
  state: TrackerState;
}

/** The signed-in shell: glass app bar, hamburger drawer, and a scrollable content pane. */
export default function AppShell({ state }: Readonly<Props>): ReactElement {
  const [section, setSection] = useState<Section>('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    logger.setRoute(section);
  }, [section]);

  function select(next: Section): void {
    setSection(next);
    setMenuOpen(false);
  }

  return (
    <>
      <AppHeader
        branding={state.branding}
        title={titleOf(section)}
        status={state.status}
        onOpenMenu={() => setMenuOpen(true)}
      />
      <NavDrawer
        open={menuOpen}
        section={section}
        user={state.user}
        unreadMessages={state.unreadMessages}
        onClose={() => setMenuOpen(false)}
        onSelect={select}
      />
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: 2.5 }}>
        {/* Keyed by section: a crashed pane leaves the drawer working, and moving on clears it. */}
        <LogErrorBoundary
          key={section}
          logger={logger}
          fallback={(error, reset) => <CrashFallback error={error} onRetry={reset} />}
        >
          <SectionView section={section} state={state} />
        </LogErrorBoundary>
      </Box>
    </>
  );
}
