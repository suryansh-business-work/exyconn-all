import { useT } from '@exyconn/i18n';
import { Box, Flex, Heading, Text } from '@exyconn/shell/components/ui';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { panel } from '@exyconn/shell/components/glass/glass';
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
  const t = useT();
  return (
    <Box sx={[panel, { height: '100%' }]}>
      <Heading level={6}>{t('Live announcements')}</Heading>
      {rows.length === 0 && (
        <Text size="sm" color="text.secondary">
          {t('Nothing published right now.')}
        </Text>
      )}
      {rows.map((row) => (
        <Box key={row.id} sx={{ mt: 1.5 }}>
          <Flex direction="row" alignItems="center" spacing={1}>
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
