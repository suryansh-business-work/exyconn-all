import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EventIcon from '@mui/icons-material/Event';
import PublicIcon from '@mui/icons-material/Public';
import ScheduleIcon from '@mui/icons-material/Schedule';
import VideocamIcon from '@mui/icons-material/Videocam';
import type { ReactNode } from 'react';
import { useT } from '@exyconn/i18n';
import { Flex, IconButton, Stack, Text } from '@exyconn/shell/components/ui';
import type { PublicMeetingFieldsFragment } from '@exyconn/shell/graphql/generated';

function Fact({ icon, children }: Readonly<{ icon: ReactNode; children: ReactNode }>) {
  return (
    <Flex direction="row" spacing={1} alignItems="flex-start">
      {icon}
      <Text size="sm" weight="semibold" color="text.secondary">
        {children}
      </Text>
    </Flex>
  );
}

interface MeetingSummaryProps {
  meeting: PublicMeetingFieldsFragment;
  /** The company's booking page, which the back button returns to. */
  backTo: string;
  /** The chosen time, e.g. "8:30 pm – 9:00 pm, Friday, October 16", once one is picked. */
  chosen?: string;
  zone?: string;
}

/** The left column: whose meeting, how long, where, the picked time, and what it is about. */
export function MeetingSummary({ meeting, backTo, chosen, zone }: Readonly<MeetingSummaryProps>) {
  const t = useT();
  const navigate = useNavigate();
  return (
    <Stack spacing={2}>
      <IconButton
        onClick={() => navigate(backTo)}
        aria-label={t('All meetings')}
        sx={{ alignSelf: 'flex-start', border: 1, borderColor: 'divider' }}
      >
        <ArrowBackIcon />
      </IconButton>
      <Stack spacing={0.5}>
        <Text weight="semibold" color="text.secondary">
          {meeting.organizationName}
        </Text>
        <Text component="h1" size="lg" weight="bold">
          {meeting.title}
        </Text>
      </Stack>
      <Fact icon={<ScheduleIcon fontSize="small" />}>
        {t('{minutes} min', { minutes: meeting.durationMinutes })}
      </Fact>
      {meeting.hasLocation && (
        <Fact icon={<VideocamIcon fontSize="small" />}>
          {t('Meeting details are shared once you book.')}
        </Fact>
      )}
      {chosen && <Fact icon={<EventIcon fontSize="small" />}>{chosen}</Fact>}
      {zone && <Fact icon={<PublicIcon fontSize="small" />}>{zone}</Fact>}
      {meeting.description && <Text sx={{ whiteSpace: 'pre-line' }}>{meeting.description}</Text>}
    </Stack>
  );
}
