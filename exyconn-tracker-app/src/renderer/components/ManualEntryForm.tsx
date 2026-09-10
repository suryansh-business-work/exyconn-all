import type { ReactElement, FormEvent } from 'react';
import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  DateTimePicker,
  Flex,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@exyconn/ui';
import type { ManualEntryDraft, TrackerProject, TrackerTask } from '@shared/types';

interface Props {
  projects: TrackerProject[];
  onCancel: () => void;
  onDone: () => void;
}

const NO_TICKET = '';

/**
 * Claims work done away from the computer — a client meeting, a site visit, a call.
 *
 * The window and the note are the whole point: a reviewer decides on hours nobody measured,
 * and can only do that if they can see when the work happened and what it was. Everything
 * beyond "there is something in each box" is the portal's to judge, and its refusal is shown
 * verbatim rather than second-guessed here.
 */
export default function ManualEntryForm({
  projects,
  onCancel,
  onDone,
}: Readonly<Props>): ReactElement {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '');
  const [tasks, setTasks] = useState<TrackerTask[]>([]);
  const [taskId, setTaskId] = useState(NO_TICKET);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [endedAt, setEndedAt] = useState<Date | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // The ticket list belongs to the project chosen here, not to the one the next session is
  // booked against — browsing in this form must not re-point that.
  useEffect(() => {
    let active = true;
    setTaskId(NO_TICKET);
    if (projectId === '') {
      setTasks([]);
      return undefined;
    }
    window.tracker
      .getTasks(projectId)
      .then((rows) => {
        if (active) {
          setTasks(rows);
        }
      })
      .catch((cause: unknown) => {
        console.error('Loading tickets failed', cause);
        if (active) {
          setTasks([]);
        }
      });
    return () => {
      active = false;
    };
  }, [projectId]);

  function draftFrom(start: Date, end: Date): ManualEntryDraft {
    return {
      projectId,
      taskId,
      startedAt: start.toISOString(),
      endedAt: end.toISOString(),
      note: note.trim(),
    };
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (startedAt === null || endedAt === null || note.trim() === '') {
      setError('Fill in when the work happened and what it was for.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await window.tracker.createManualEntry(draftFrom(startedAt, endedAt));
      onDone();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'The claim could not be filed.');
      setSaving(false);
    }
  }

  return (
    <Stack component="form" spacing={2} onSubmit={(event) => void submit(event)}>
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
        }}
      >
        Claimed hours are the one thing the tracker did not measure, so they wait for a manager.
        Nothing here counts until somebody approves it.
      </Typography>

      {error !== null && <Alert severity="error">{error}</Alert>}

      <TextField
        select
        size="small"
        label="Project"
        value={projectId}
        onChange={(event) => setProjectId(event.target.value)}
      >
        {projects.map((project) => (
          <MenuItem key={project.id} value={project.id}>
            {project.name}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        size="small"
        label="Ticket"
        value={taskId}
        onChange={(event) => setTaskId(event.target.value)}
      >
        <MenuItem value={NO_TICKET}>No ticket</MenuItem>
        {tasks.map((task) => (
          <MenuItem key={task.id} value={task.id}>
            {task.key} · {task.title}
          </MenuItem>
        ))}
      </TextField>

      <DateTimePicker
        label="From"
        value={startedAt}
        onChange={setStartedAt}
        disableFuture
        slotProps={{ textField: { size: 'small' } }}
      />
      <DateTimePicker
        label="To"
        value={endedAt}
        onChange={setEndedAt}
        disableFuture
        slotProps={{ textField: { size: 'small' } }}
      />

      <TextField
        size="small"
        label="What was the time for?"
        value={note}
        multiline
        minRows={2}
        onChange={(event) => setNote(event.target.value)}
      />

      <Flex direction="row" justifyContent="flex-end" gap={1}>
        <Button color="inherit" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={saving}>
          Submit claim
        </Button>
      </Flex>
    </Stack>
  );
}
