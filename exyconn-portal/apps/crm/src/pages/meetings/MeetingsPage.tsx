import { Box } from '@exyconn/shell/components/ui';
import { readingPanel } from '@exyconn/shell/components/glass/glass';
import { Tabber, type TabberItem } from '@exyconn/tabber';
import { BookingsPanel } from './BookingsPanel';
import { MeetingTypesPanel } from './MeetingTypesPanel';
import { MeetingSettingsPanel } from './MeetingSettingsPanel';
import { TrackingPanel } from './tracking/TrackingPanel';

export const MEETINGS_PATH = '/meetings';

const TABS: TabberItem[] = [
  { slug: 'types', label: 'Meeting types', content: <MeetingTypesPanel /> },
  { slug: 'bookings', label: 'Bookings', content: <BookingsPanel /> },
  { slug: 'tracking', label: 'Tracking', content: <TrackingPanel /> },
  { slug: 'settings', label: 'Settings', content: <MeetingSettingsPanel /> },
];

/**
 * CRM > Meetings: Calendly-style scheduling. A meeting type has a public link
 * (crm.exyconn.com/organization/<company>/book/<page>/<link>) where anyone picks a free time; each
 * booking lands on the person's CRM contact as a meeting. Tracking counts the visits and Settings
 * holds the page address, Slack and the fixed video rooms.
 */
export function MeetingsPage() {
  return (
    <Box sx={readingPanel}>
      <Tabber basePath={MEETINGS_PATH} items={TABS} ariaLabel="Meetings" />
    </Box>
  );
}
