import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { useT } from '@exyconn/i18n';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useUpdateMarketingSuppressionNoteMutation } from '@exyconn/shell/graphql/generated';
import { MAX_NOTE } from '../suppression';
import { suppressionNoteSchema, type SuppressionNoteValues } from './suppression-note.types';

interface SuppressionNoteFormProps {
  id: string;
  note: string;
  onDone: () => void;
  onCancel: () => void;
}

/** Edits the internal note only — the reason and source record what happened. */
export function SuppressionNoteForm({
  id,
  note,
  onDone,
  onCancel,
}: Readonly<SuppressionNoteFormProps>) {
  const t = useT();
  const notify = useNotify();
  const [updateNote] = useUpdateMarketingSuppressionNoteMutation();
  const methods = useForm<SuppressionNoteValues>({
    mode: 'onTouched',
    resolver: zodResolver(suppressionNoteSchema),
    defaultValues: { note },
  });
  const current = useWatch({ control: methods.control, name: 'note' });
  const submit = async (values: SuppressionNoteValues) => {
    try {
      await updateNote({ variables: { id, note: values.note } });
      notify('Note saved', 'success');
      onDone();
    } catch (err) {
      notify(errorMessage(err, 'The note could not be saved'), 'error');
    }
  };
  return (
    <EntityForm
      methods={methods}
      onSubmit={submit}
      isEdit
      onCancel={onCancel}
      submitLabel="Save note"
    >
      <RhfTextField
        name="note"
        label="Internal note"
        multiline
        rows={4}
        autoFocus
        slotProps={{ htmlInput: { maxLength: MAX_NOTE } }}
        helperText={t('Visible to the marketing team only. {used}/{max}', {
          used: current.length,
          max: MAX_NOTE,
        })}
      />
    </EntityForm>
  );
}
