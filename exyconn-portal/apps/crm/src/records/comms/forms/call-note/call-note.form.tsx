import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useT } from '@exyconn/i18n';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useAuth } from '@exyconn/shell/auth/AuthContext';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  ActivitySubject,
  ActivityType,
  CrmTimelineDocument,
  useCreateActivityMutation,
} from '@exyconn/shell/graphql/generated';
import { readMemory, type CommsPanel } from '../../commsStore';
import { useFormMemory } from '../../useFormMemory';
import { callNoteSchema, type CallNoteValues } from './call-note.types';

const DRAFT = 'call-note';

interface CallNoteFormProps {
  panel: CommsPanel;
  onCancel: () => void;
}

/** React Hook Form + Zod form for notes taken during a call, logged on the record's timeline. */
export function CallNoteForm({ panel, onCancel }: Readonly<CallNoteFormProps>) {
  const t = useT();
  const notify = useNotify();
  const { user } = useAuth();
  const [createActivity] = useCreateActivityMutation({ refetchQueries: [CrmTimelineDocument] });
  const methods = useForm<CallNoteValues>({
    mode: 'onTouched',
    resolver: zodResolver(callNoteSchema),
    defaultValues: readMemory<CallNoteValues>(panel.key, DRAFT) ?? { notes: '' },
  });
  useFormMemory(methods, panel.key, DRAFT);

  const onSubmit = async (values: CallNoteValues) => {
    try {
      await createActivity({
        variables: {
          input: {
            type: ActivityType.Note,
            subject: t('Call notes: {name}', { name: panel.name }),
            notes: values.notes,
            relatedType:
              panel.object === 'CONTACT' ? ActivitySubject.Contact : ActivitySubject.Company,
            relatedId: panel.id,
            relatedName: panel.name,
            done: true,
            owner: user?.name ?? '',
            attachments: [],
          },
        },
      });
      notify('Note saved', 'success');
      methods.reset({ notes: '' });
    } catch (error) {
      portalLogger.warn('crm: saving a call note failed', error);
      notify(errorMessage(error, 'The note could not be saved'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      submitLabel="Save note"
      onCancel={onCancel}
    >
      <RhfTextField name="notes" label="Notes" multiline minRows={3} />
    </EntityForm>
  );
}
