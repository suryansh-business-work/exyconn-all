import { useState } from 'react';
import Box from '@mui/material/Box';
import type { TrackerState } from '@shared/types';
import AppHeader from './components/AppHeader';
import NavDrawer from './components/NavDrawer';
import DashboardScreen from './screens/DashboardScreen';
import MyReportScreen from './screens/MyReportScreen';
import SettingsScreen from './screens/SettingsScreen';
import { NAV_ITEMS, type Section } from './sections';

interface SectionProps {
  section: Section;
  state: TrackerState;
}

/** Renders the pane for the selected section (module scope — never nested in AppShell). */
function SectionView({ section, state }: Readonly<SectionProps>): JSX.Element {
  if (section === 'report') {
    return <MyReportScreen timezone={state.timezone} />;
  }
  if (section === 'settings') {
    return (
      <SettingsScreen
        settings={state.settings}
        branding={state.branding}
        timezone={state.timezone}
        preferences={state.preferences}
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
export default function AppShell({ state }: Readonly<Props>): JSX.Element {
  const [section, setSection] = useState<Section>('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);

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
        onClose={() => setMenuOpen(false)}
        onSelect={select}
      />
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: 2.5 }}>
        <SectionView section={section} state={state} />
      </Box>
    </>
  );
}
