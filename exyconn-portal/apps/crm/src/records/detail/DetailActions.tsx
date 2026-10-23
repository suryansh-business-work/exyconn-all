import { useState, type ReactNode } from 'react';
import CallIcon from '@mui/icons-material/Call';
import AlarmAddIcon from '@mui/icons-material/AlarmAdd';
import EventIcon from '@mui/icons-material/Event';
import NoteIcon from '@mui/icons-material/StickyNote2';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import { useT } from '@exyconn/i18n';
import { Flex, IconButton, Tooltip } from '@exyconn/shell/components/ui';
import { ActivityType } from '@exyconn/shell/graphql/generated';
import type { LogActivityTarget } from './forms/log-activity';
import { ActivityDialog, type ActivityChoice } from './ActivityDialog';

/** Each thing that can be logged, as an icon whose tooltip names it. */
export const ACTIVITY_ACTIONS: ReadonlyArray<{
  choice: ActivityChoice;
  label: string;
  icon: ReactNode;
}> = [
  { choice: ActivityType.Note, label: 'Add note', icon: <NoteIcon /> },
  { choice: ActivityType.Call, label: 'Log call', icon: <CallIcon /> },
  { choice: ActivityType.Task, label: 'Add task', icon: <TaskAltIcon /> },
  { choice: ActivityType.Meeting, label: 'Log meeting', icon: <EventIcon /> },
  { choice: 'REMINDER', label: 'Add reminder', icon: <AlarmAddIcon /> },
];

interface DetailActionsProps {
  target: LogActivityTarget;
}

/** The icons under a profile: log a note, call, task or meeting, or set a reminder. */
export function DetailActions({ target }: Readonly<DetailActionsProps>) {
  const t = useT();
  const [choice, setChoice] = useState<ActivityChoice | null>(null);
  return (
    <>
      <Flex
        direction="row"
        spacing={1}
        flexWrap="wrap"
        useFlexGap
        role="group"
        aria-label={t('Log activity')}
      >
        {ACTIVITY_ACTIONS.map((action) => (
          <Tooltip key={action.choice} title={t(action.label)}>
            <IconButton
              aria-label={t(action.label)}
              onClick={() => setChoice(action.choice)}
              sx={{ border: 1, borderColor: 'divider' }}
            >
              {action.icon}
            </IconButton>
          </Tooltip>
        ))}
      </Flex>
      <ActivityDialog target={target} choice={choice} onClose={() => setChoice(null)} />
    </>
  );
}
