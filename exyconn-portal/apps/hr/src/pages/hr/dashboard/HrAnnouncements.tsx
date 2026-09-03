import { Box, Flex, Heading, Text } from '@exyconn/shell/components/ui';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { glass } from '@exyconn/shell/components/glass/glass';
import PushPinIcon from '@mui/icons-material/PushPin';

interface AnnouncementRow {
  id: string;
  title: string;
  category: string;
  pinned: boolean;
  publishedAt: string;
}

interface HrAnnouncementsProps {
  rows: AnnouncementRow[];
  formatDate: (value: string) => string;
}

/** What is currently published to every employee. */
export function HrAnnouncements({ rows, formatDate }: Readonly<HrAnnouncementsProps>) {
  return (
    <Box sx={[glass, { p: 2, height: '100%' }]}>
      <Heading level={6}>Live announcements</Heading>
      {rows.length === 0 && (
        <Text size="sm" color="text.secondary">
          Nothing published right now.
        </Text>
      )}
      {rows.map((row) => (
        <Box key={row.id} sx={{ mt: 1.25 }}>
          <Flex direction="row" alignItems="center" spacing={0.75}>
            {row.pinned && <PushPinIcon fontSize="small" color="warning" />}
            <Text weight="medium">{row.title}</Text>
            <StatusChip value={row.category} />
          </Flex>
          <Text size="caption" color="text.secondary">
            {formatDate(row.publishedAt)}
          </Text>
        </Box>
      ))}
    </Box>
  );
}
