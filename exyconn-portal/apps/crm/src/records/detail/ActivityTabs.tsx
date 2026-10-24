import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Button, Flex, Stack } from '@exyconn/shell/components/ui';
import type { TabberItem } from '@exyconn/tabber';
import {
  ActivityType,
  CrmTimelineKind,
  type CrmTimelineObject,
} from '@exyconn/shell/graphql/generated';
import { ActivityDialog, type ActivityChoice } from './ActivityDialog';
import { ACTIVITY_ACTIONS } from './DetailActions';
import type { LogActivityTarget } from './forms/log-activity';
import { Timeline } from './timeline/Timeline';
import type { TimelineRow } from './timeline/TimelineEntry';

/** One tab per thing that can be logged: what it lists and what its Add button logs. */
const ACTIVITY_TABS: ReadonlyArray<{
  slug: string;
  label: string;
  choice: ActivityChoice;
  empty: string;
  match: (row: TimelineRow) => boolean;
}> = [
  {
    slug: 'notes',
    label: 'Notes',
    choice: ActivityType.Note,
    empty: 'No notes yet.',
    match: (row) => row.kind === CrmTimelineKind.Note,
  },
  {
    slug: 'calls',
    label: 'Calls',
    choice: ActivityType.Call,
    empty: 'No calls logged yet.',
    match: (row) => row.kind === CrmTimelineKind.Call,
  },
  {
    slug: 'tasks',
    label: 'Tasks',
    choice: ActivityType.Task,
    empty: 'No tasks yet.',
    match: (row) => row.kind === CrmTimelineKind.Task && !row.remindAt,
  },
  {
    slug: 'meetings',
    label: 'Meetings',
    choice: ActivityType.Meeting,
    empty: 'No meetings logged yet.',
    match: (row) => row.kind === CrmTimelineKind.Meeting,
  },
  {
    slug: 'reminders',
    label: 'Reminders',
    choice: 'REMINDER',
    empty: 'No reminders set.',
    match: (row) => Boolean(row.remindAt),
  },
];

interface ActivityTabProps {
  object: CrmTimelineObject;
  target: LogActivityTarget;
  tab: (typeof ACTIVITY_TABS)[number];
}

/** One kind of activity with the record, newest first, and the button that logs another. */
function ActivityTab({ object, target, tab }: Readonly<ActivityTabProps>) {
  const t = useT();
  const [choice, setChoice] = useState<ActivityChoice | null>(null);
  const action = ACTIVITY_ACTIONS.find((each) => each.choice === tab.choice);
  return (
    <Stack spacing={2}>
      <Flex direction="row" justifyContent="flex-end">
        <Button variant="contained" startIcon={action?.icon} onClick={() => setChoice(tab.choice)}>
          {t(action?.label ?? tab.label)}
        </Button>
      </Flex>
      <Timeline
        object={object}
        id={target.relatedId}
        limit={200}
        match={tab.match}
        emptyText={tab.empty}
      />
      <ActivityDialog target={target} choice={choice} onClose={() => setChoice(null)} />
    </Stack>
  );
}

/** A contact's or company's Notes, Calls, Tasks, Meetings and Reminders tabs. */
export function activityTabs(object: CrmTimelineObject, target: LogActivityTarget): TabberItem[] {
  return ACTIVITY_TABS.map((tab) => ({
    slug: tab.slug,
    label: tab.label,
    content: <ActivityTab object={object} target={target} tab={tab} />,
  }));
}
