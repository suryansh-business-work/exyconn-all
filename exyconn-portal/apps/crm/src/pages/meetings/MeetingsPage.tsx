import { Box } from '@exyconn/shell/components/ui';
import { readingPanel } from '@exyconn/shell/components/glass/glass';
import { Tabber, type TabberItem } from '@exyconn/tabber';
import { BookingsPanel } from './BookingsPanel';
import { MeetingTypesPanel } from './MeetingTypesPanel';

export const MEETINGS_PATH = '/crm/meetings';

const TABS: TabberItem[] = [
  { slug: 'types', label: 'Meeting types', content: <MeetingTypesPanel /> },
  { slug: 'bookings', label: 'Bookings', content: <BookingsPanel /> },
];

/**
 * CRM > Meetings: Calendly-style scheduling. A meeting type has a public link
 * (crm.exyconn.com/book/<company>/<link>) where anyone picks a free time; each booking lands on the
 * person's CRM contact as a meeting.
 */
export function MeetingsPage() {
  return (
    <Box sx={readingPanel}>
      <Tabber basePath={MEETINGS_PATH} items={TABS} ariaLabel="Meetings" />
    </Box>
  );
}
