import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { z } from 'zod';
import { useT } from '@exyconn/i18n';
import { Alert, Button } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useMaUpdateNotesMutation } from '@exyconn/shell/graphql/generated';
import { LIST_SECTIONS } from '../../notes/notes-sections';
import { toFormValues, toNotesContent } from './notes.mapping';
import type { EditableNotes, NotesFormValues } from './notes.types';

const MAX_PROSE = 20_000;
const MAX_LIST = 10_000;

const prose = z.string().max(MAX_PROSE, 'Keep this under 20,000 characters');
const list = z.string().max(MAX_LIST, 'Keep this list under 10,000 characters');

const schema = z.object({
  executiveSummary: prose,
  overview: prose,
  agenda: list,
  discussionPoints: list,
  risks: list,
  blockers: list,
  openQuestions: list,
  followUps: list,
  nextTopics: list,
});

interface NotesFormProps {
  meetingId: string;
  notes: EditableNotes;
  onDone: () => void;
  onCancel: () => void;
  /** Re-reads the notes — offered when somebody else saved a newer version first. */
  onReload: () => void;
}

/**
 * Edits the meeting notes. The save names the version it started from, so when someone else
 * saved in the meantime the server refuses it rather than overwriting their work.
 */
export function NotesForm({
  meetingId,
  notes,
  onDone,
  onCancel,
  onReload,
}: Readonly<NotesFormProps>) {
  const t = useT();
  const notify = useNotify();
  const [updateNotes] = useMaUpdateNotesMutation();
  const [failure, setFailure] = useState<string | null>(null);
  const methods = useForm<NotesFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: toFormValues(notes.content),
  });

  const onSubmit = async (values: NotesFormValues) => {
    try {
      await updateNotes({
        variables: { meetingId, content: toNotesContent(values), expectedVersion: notes.version },
      });
      notify('Notes saved', 'success');
      onDone();
    } catch (error) {
      setFailure(errorMessage(error, 'The notes could not be saved.'));
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit
      onCancel={onCancel}
      submitLabel="Save notes"
    >
      {failure && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={onReload}>
              {t('Reload notes')}
            </Button>
          }
        >
          {failure}
        </Alert>
      )}
      <RhfTextField
        name="executiveSummary"
        label="Executive summary"
        multiline
        minRows={2}
        helperText="A few lines on the outcome, for readers who will not read further."
      />
      <RhfTextField
        name="overview"
        label="Overview"
        multiline
        minRows={4}
        helperText="What the meeting covered, in more detail than the summary."
      />
      {LIST_SECTIONS.map((section) => (
        <RhfTextField
          key={section.key}
          name={section.key}
          label={section.label}
          multiline
          minRows={2}
          helperText="One item per line"
        />
      ))}
    </EntityForm>
  );
}
