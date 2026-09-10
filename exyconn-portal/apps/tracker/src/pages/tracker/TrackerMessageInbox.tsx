import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, Grid, Typography } from '@exyconn/shell/components/ui';
import { withParam } from '@exyconn/shell/utils/searchParams';
import { useTrackerMessageThreadsQuery } from '@exyconn/shell/graphql/generated';
import { TrackerMessageThreadList } from './TrackerMessageThreadList';
import { TrackerMessageThread } from './TrackerMessageThread';

/** Query-string key holding whose conversation is open, so a thread can be linked to. */
const EMPLOYEE_PARAM = 'employee';

/**
 * The tracker desk's inbox: who has written in on the left, the conversation on the right.
 *
 * The list polls, because a reply that only appears on a refresh is a reply somebody waits
 * a working day for. Which thread is open lives in the URL, so a colleague can be sent
 * straight to the conversation rather than told whose name to click.
 */
export function TrackerMessageInbox() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedUserId = searchParams.get(EMPLOYEE_PARAM);
  const { data } = useTrackerMessageThreadsQuery({
    fetchPolicy: 'cache-and-network',
    pollInterval: 30_000,
  });

  const select = useCallback(
    (userId: string) => {
      setSearchParams((current) => withParam(current, EMPLOYEE_PARAM, userId), { replace: true });
    },
    [setSearchParams],
  );

  const threads = data?.trackerMessageThreads ?? [];
  const selected = threads.find((thread) => thread.userId === selectedUserId);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={4}>
        <Card variant="outlined">
          <TrackerMessageThreadList
            threads={threads}
            selectedUserId={selectedUserId}
            onSelect={select}
          />
        </Card>
      </Grid>
      <Grid item xs={12} md={8}>
        <Card variant="outlined" sx={{ p: 2, minHeight: 360 }}>
          {selected ? (
            <TrackerMessageThread userId={selected.userId} userName={selected.userName} />
          ) : (
            <Typography variant="body2" color="text.secondary">
              Pick a conversation to read and reply to it.
            </Typography>
          )}
        </Card>
      </Grid>
    </Grid>
  );
}
