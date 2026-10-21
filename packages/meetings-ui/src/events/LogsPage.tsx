import { Box } from '@exyconn/shell/components/ui';
import { densePanel } from '@exyconn/shell/components/glass/glass';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { meetingPaths, type MeetingPageProps } from '../lib/scope';
import { MeetingEvents } from './MeetingEvents';

/** Meeting Assistant → Logs: sign-ins, consent, capture, imports, notes, email and errors. */
export function LogsPage({ scope, basePath }: Readonly<MeetingPageProps>) {
  const paths = meetingPaths(basePath);
  return (
    <>
      <PageHeader
        title="Logs"
        subtitle="Everything the assistant did, newest first — open an entry for its details"
      />
      <Box sx={densePanel}>
        <MeetingEvents scope={scope} meetingHref={paths.detail} />
      </Box>
    </>
  );
}
