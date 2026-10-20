import { useT } from '@exyconn/i18n';
import { Box, Grid, Heading } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import type { MaMeetingDetailFragment } from '@exyconn/shell/graphql/generated';
import { MeetingDetailsForm } from '../../forms/meeting-details';
import { MeetingFacts } from './MeetingFacts';
import { FollowUpPanel } from './FollowUpPanel';

/** The overview tab: the facts, the title/language editor and the follow-up from last time. */
interface OverviewTabProps {
  meeting: MaMeetingDetailFragment;
  listPath: string;
}

export function OverviewTab({ meeting, listPath }: Readonly<OverviewTabProps>) {
  const t = useT();
  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Box sx={panel}>
          <MeetingFacts meeting={meeting} />
        </Box>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Box sx={panel}>
          <Heading level={2} sx={{ typography: 'h6', mb: 2 }}>
            {t('Details')}
          </Heading>
          <MeetingDetailsForm key={meeting.id} meeting={meeting} />
        </Box>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <FollowUpPanel meetingId={meeting.id} listPath={listPath} />
      </Grid>
    </Grid>
  );
}
