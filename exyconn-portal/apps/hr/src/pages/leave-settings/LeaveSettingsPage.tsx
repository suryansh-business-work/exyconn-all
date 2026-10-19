import PolicyIcon from '@mui/icons-material/Policy';
import DateRangeIcon from '@mui/icons-material/DateRange';
import { Box } from '@exyconn/shell/components/ui';
import { Tabber, type TabberItem } from '@exyconn/tabber';
import { LeavePoliciesPage } from '../leave-policies';
import { LEAVE_SETTINGS_PATH } from './leave-settings.constants';
import { WorkWeekTab } from './WorkWeekTab';

const TABS: TabberItem[] = [
  {
    slug: 'leave-types',
    label: 'Leave types',
    icon: <PolicyIcon />,
    content: <LeavePoliciesPage />,
  },
  {
    slug: 'work-week',
    label: 'Work week',
    icon: <DateRangeIcon />,
    content: <WorkWeekTab />,
  },
];

/**
 * HR → Leave → Leave Settings: the company's leave types, each set once globally and
 * overridden per country, and the working week everyone follows unless their record says
 * otherwise. Holidays have their own page (HR → Leave → Holidays).
 */
export function LeaveSettingsPage() {
  return (
    <Box>
      <Tabber basePath={LEAVE_SETTINGS_PATH} items={TABS} ariaLabel="Leave settings" />
    </Box>
  );
}
