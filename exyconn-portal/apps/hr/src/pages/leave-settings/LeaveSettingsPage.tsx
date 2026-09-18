import PolicyIcon from '@mui/icons-material/Policy';
import CelebrationIcon from '@mui/icons-material/Celebration';
import { Box } from '@exyconn/shell/components/ui';
import { Tabber, type TabberItem } from '@exyconn/tabber';
import { LeavePoliciesPage } from '../leave-policies';
import { HolidaysPage } from '../holidays';
import { LEAVE_SETTINGS_PATH } from './leave-settings.constants';

const TABS: TabberItem[] = [
  {
    slug: 'leave-types',
    label: 'Leave types',
    icon: <PolicyIcon />,
    content: <LeavePoliciesPage />,
  },
  {
    slug: 'holidays',
    label: 'Holidays',
    icon: <CelebrationIcon />,
    content: <HolidaysPage />,
  },
];

/**
 * HR → Leave → Leave Settings: the company's leave types and holidays. Each is set once
 * globally and overridden per country, and employees see only what applies where they work.
 */
export function LeaveSettingsPage() {
  return (
    <Box>
      <Tabber
        basePath={LEAVE_SETTINGS_PATH}
        items={TABS}
        ariaLabel="Leave settings"
        sx={{ mb: 2 }}
      />
    </Box>
  );
}
