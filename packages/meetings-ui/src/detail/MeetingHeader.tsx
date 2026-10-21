import { Link as RouterLink } from 'react-router-dom';
import { useFormatters, useT } from '@exyconn/i18n';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, Button, Flex, Text, Typography } from '@exyconn/shell/components/ui';
import { usePageTitle } from '@exyconn/shell/components/layout/usePageTitle';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import type { MaMeetingDetailFragment } from '@exyconn/shell/graphql/generated';

interface MeetingHeaderProps {
  meeting: MaMeetingDetailFragment;
  /** The meetings list this page was opened from. */
  backTo: string;
}

/** The meeting's title, when it started and who recorded it, with its status at a glance. */
export function MeetingHeader({ meeting, backTo }: Readonly<MeetingHeaderProps>) {
  const t = useT();
  const { formatDateTime } = useFormatters();
  usePageTitle(meeting.title);
  return (
    <>
      <Button component={RouterLink} to={backTo} startIcon={<ArrowBackIcon />} color="inherit">
        {t('Back to meetings')}
      </Button>
      <Flex
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        useFlexGap
        spacing={1}
        sx={{ my: 2 }}
      >
        <Box>
          <Typography variant="h4" component="h1">
            {meeting.title}
          </Typography>
          <Text size="sm" color="text.secondary">
            {t('{when} · recorded by {owner}', {
              when: formatDateTime(meeting.startedAt),
              owner: meeting.ownerName,
            })}
          </Text>
        </Box>
        <Flex direction="row" spacing={1}>
          <StatusChip value={meeting.status} />
          <StatusChip value={meeting.summaryStatus} />
        </Flex>
      </Flex>
    </>
  );
}
