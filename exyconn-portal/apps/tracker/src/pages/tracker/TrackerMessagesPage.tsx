import { useMemo } from 'react';
import ForumIcon from '@mui/icons-material/Forum';
import CampaignIcon from '@mui/icons-material/Campaign';
import { Box, Card } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { Tabber, type TabberItem } from '@exyconn/tabber';
import { useListEmployeeOptionsQuery } from '@exyconn/shell/graphql/generated';
import { TrackerMessageInbox } from './TrackerMessageInbox';
import { TrackerNoticeForm } from './forms/tracker-notice';

/**
 * Talking to tracked desktops: the two-way inbox, and the announcements pushed out to them.
 *
 * Two tabs rather than one screen, because they are different acts. A reply goes to one
 * person who asked something; a notice lands on everybody's machine at once and cannot be
 * recalled — and putting them behind the same button would make the second as easy to send
 * by accident as the first.
 */
export function TrackerMessagesPage() {
  const usersQuery = useListEmployeeOptionsQuery();
  const employees = useMemo(
    () =>
      (usersQuery.data?.listEmployeeOptions ?? []).map((user) => ({
        value: user.id,
        label: `${user.name} (${user.email})`,
      })),
    [usersQuery.data],
  );

  const tabs: TabberItem[] = [
    {
      slug: 'inbox',
      label: 'Inbox',
      icon: <ForumIcon />,
      content: <TrackerMessageInbox />,
    },
    {
      slug: 'notice',
      label: 'Send a notice',
      icon: <CampaignIcon />,
      content: (
        <Card variant="outlined" sx={{ p: 2 }}>
          <TrackerNoticeForm employees={employees} />
        </Card>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Messages"
        subtitle="Reply to employees, or announce something to every tracker"
      />
      <Tabber basePath="/tracker/messages" items={tabs} ariaLabel="Message views" />
    </Box>
  );
}
