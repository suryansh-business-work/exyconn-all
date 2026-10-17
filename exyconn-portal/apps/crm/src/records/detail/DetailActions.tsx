import { useState, type ReactNode } from 'react';
import CallIcon from '@mui/icons-material/Call';
import EventIcon from '@mui/icons-material/Event';
import NoteIcon from '@mui/icons-material/StickyNote2';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import { useT } from '@exyconn/i18n';
import { Button, Flex } from '@exyconn/shell/components/ui';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { ActivityType } from '@exyconn/shell/graphql/generated';
import {
  LogActivityForm,
  type LogActivityTarget,
  type LogActivityValues,
} from './forms/log-activity';

type Loggable = LogActivityValues['type'];

const QUICK: ReadonlyArray<{ type: Loggable; label: string; icon: ReactNode }> = [
  { type: ActivityType.Note, label: 'Note', icon: <NoteIcon /> },
  { type: ActivityType.Call, label: 'Log call', icon: <CallIcon /> },
  { type: ActivityType.Task, label: 'Task', icon: <TaskAltIcon /> },
  { type: ActivityType.Meeting, label: 'Meeting', icon: <EventIcon /> },
];

interface DetailActionsProps {
  target: LogActivityTarget;
  /** Extra actions, such as sending an email. */
  extra?: ReactNode;
}

/** The buttons under a profile: log something against the record. */
export function DetailActions({ target, extra }: Readonly<DetailActionsProps>) {
  const t = useT();
  const [logging, setLogging] = useState<Loggable | null>(null);
  const close = () => setLogging(null);
  return (
    <>
      <Flex direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {QUICK.map((action) => (
          <Button
            key={action.type}
            size="small"
            variant="outlined"
            startIcon={action.icon}
            onClick={() => setLogging(action.type)}
          >
            {t(action.label)}
          </Button>
        ))}
        {extra}
      </Flex>
      <CrudDialog open={logging !== null} title={t('Log activity')} onClose={close}>
        {logging && (
          <LogActivityForm target={target} type={logging} onDone={close} onCancel={close} />
        )}
      </CrudDialog>
    </>
  );
}
