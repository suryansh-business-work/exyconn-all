import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import EngineeringIcon from '@mui/icons-material/Engineering';
import { Box } from '@exyconn/shell/components/ui';
import { Tabber, type TabberItem } from '@exyconn/tabber';
import { IncidentsPanel } from './IncidentsPanel';
import { MaintenancePanel } from './MaintenancePanel';
import { INCIDENTS_PATH } from './incidents.constants';

const TABS: TabberItem[] = [
  {
    slug: 'incidents',
    label: 'Incidents',
    icon: <ReportProblemIcon />,
    content: <IncidentsPanel />,
  },
  {
    slug: 'maintenance',
    label: 'Maintenance',
    icon: <EngineeringIcon />,
    content: <MaintenancePanel />,
  },
];

/**
 * Tech → Incidents: what status.exyconn.com tells the public. Incidents are opened by
 * the monitor or by hand and narrated through updates; maintenance windows are planned
 * ahead so the page can say so before anything goes quiet.
 */
export function IncidentsPage() {
  return (
    <Box>
      <Tabber basePath={INCIDENTS_PATH} items={TABS} ariaLabel="Incidents" sx={{ mb: 2 }} />
    </Box>
  );
}
