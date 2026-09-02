import { Box, Flex, Heading, Text } from '@exyconn/shell/components/ui';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { glass } from '@exyconn/shell/components/glass/glass';
import PushPinIcon from '@mui/icons-material/PushPin';

export interface AnnouncementSummary {
  id: string;
  title: string;
  category: string;
  pinned: boolean;
  publishedAt: string;
}

interface LatestAnnouncementsProps {
  announcements: AnnouncementSummary[];
  formatDate: (value: string) => string;
}

/** The few most recent live announcements, pinned first (the API already sorts). */
export function LatestAnnouncements({
  announcements,
  formatDate,
}: Readonly<LatestAnnouncementsProps>) {
  return (
    <Box sx={[glass, { p: 2, height: '100%' }]}>
      <Heading level={6}>Announcements</Heading>
      {announcements.length === 0 && (
        <Text size="sm" color="text.secondary">
          Nothing announced right now.
        </Text>
      )}
      {announcements.map((announcement) => (
        <Box key={announcement.id} sx={{ mt: 1.5 }}>
          <Flex direction="row" alignItems="center" spacing={0.75}>
            {announcement.pinned && <PushPinIcon fontSize="small" color="warning" />}
            <Text weight="medium">{announcement.title}</Text>
            <StatusChip value={announcement.category} />
          </Flex>
          <Text size="caption" color="text.secondary">
            {formatDate(announcement.publishedAt)}
          </Text>
        </Box>
      ))}
    </Box>
  );
}
