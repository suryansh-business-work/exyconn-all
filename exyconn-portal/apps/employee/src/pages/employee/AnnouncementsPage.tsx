import { Box, Flex, Heading, Text } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import PushPinIcon from '@mui/icons-material/PushPin';
import { useActiveAnnouncementsQuery } from '@exyconn/shell/graphql/generated';

/** Employee self-service: the live company announcement feed, pinned first. */
export function AnnouncementsPage() {
  const { data, loading } = useActiveAnnouncementsQuery({ fetchPolicy: 'cache-and-network' });
  const { formatDate } = useSettings();
  const rows = data?.activeAnnouncements ?? [];

  return (
    <Box>
      <PageHeader title="Announcements" subtitle="Notices, policies and updates from HR" />

      {rows.length === 0 && (
        <Box sx={[glass, { p: 3 }]}>
          <Text color="text.secondary">
            {loading ? 'Loading…' : 'Nothing announced right now.'}
          </Text>
        </Box>
      )}

      <Flex direction="column" spacing={2}>
        {rows.map((row) => (
          <Box key={row.id} sx={[glass, { p: 2.5 }]}>
            <Flex direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
              {row.pinned && <PushPinIcon fontSize="small" color="warning" />}
              <Heading level={6}>{row.title}</Heading>
              <StatusChip value={row.category} />
            </Flex>
            <Text size="caption" color="text.secondary">
              {formatDate(row.publishedAt)}
            </Text>
            <Text sx={{ mt: 1, whiteSpace: 'pre-line' }}>{row.body}</Text>
          </Box>
        ))}
      </Flex>
    </Box>
  );
}
