import PolicyIcon from '@mui/icons-material/Policy';
import { Box } from '@exyconn/shell/components/ui';
import { Tabber, type TabberItem } from '@exyconn/tabber';
import { LeavePoliciesPage } from '../leave-policies';
import { LEAVE_SETTINGS_PATH } from './leave-settings.constants';

const TABS: TabberItem[] = [
  {
    slug: 'leave-types',
    label: 'Leave types',
    icon: <PolicyIcon />,
    content: <LeavePoliciesPage />,
  },
];

/**
 * HR → Leave → Leave Settings: the company's leave types, each set once globally and
 * overridden per country. Holidays have their own page (HR → Leave → Holidays).
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
