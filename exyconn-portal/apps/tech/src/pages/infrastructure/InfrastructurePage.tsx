import type { ReactNode } from 'react';
import DnsIcon from '@mui/icons-material/Dns';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import LayersIcon from '@mui/icons-material/Layers';
import { Box } from '@exyconn/shell/components/ui';
import { glass } from '@exyconn/shell/components/glass/glass';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { Tabber, type TabberItem } from '@exyconn/tabber';
import { HostPanel } from './HostPanel';
import { ContainersPanel } from './ContainersPanel';
import { StoragePanel } from './StoragePanel';

/** Route the tabs live under; each tab is a slug beneath it. */
export const INFRASTRUCTURE_PATH = '/tech/infrastructure';

/** The card every tab's panel sits in, so the tab strip stays above the card. */
function GlassPanel({ children }: Readonly<{ children: ReactNode }>) {
  return <Box sx={[glass, { p: { xs: 2, md: 3 } }]}>{children}</Box>;
}

const TABS: TabberItem[] = [
  {
    slug: 'host',
    label: 'Host',
    icon: <DnsIcon />,
    content: (
      <GlassPanel>
        <HostPanel />
      </GlassPanel>
    ),
  },
  {
    slug: 'containers',
    label: 'Containers',
    icon: <ViewInArIcon />,
    content: (
      <GlassPanel>
        <ContainersPanel />
      </GlassPanel>
    ),
  },
  {
    slug: 'storage',
    label: 'Images & Storage',
    icon: <LayersIcon />,
    content: (
      <GlassPanel>
        <StoragePanel />
      </GlassPanel>
    ),
  },
];

/**
 * Infrastructure — where this platform actually runs: the Docker host, every container
 * on it with the commit tag it was deployed from, and what the engine's disk holds.
 * Read live from the engine through a read-only socket proxy; nothing here is stored.
 */
export function InfrastructurePage() {
  return (
    <Box>
      <PageHeader
        title="Infrastructure"
        subtitle="The host, the running stack and the database this portal runs on"
      />
      <Tabber
        basePath={INFRASTRUCTURE_PATH}
        items={TABS}
        ariaLabel="Infrastructure"
        sx={{ mb: 2 }}
      />
    </Box>
  );
}
