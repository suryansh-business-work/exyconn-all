import { useNotify } from '@/components/feedback/NotificationProvider';
import { errorMessage } from '@/utils/errorMessage';

export interface UseEntitySaveOptions<TValues, TRow> {
  /** Sentence-case entity name used in the toast, e.g. "Lead" → "Lead created". */
  label: string;
  /** The row being edited, or null when creating. */
  initial: TRow | null;
  create: (values: TValues) => Promise<unknown>;
  update: (row: TRow, values: TValues) => Promise<unknown>;
  /** Runs after a successful save — usually closes the dialog and reloads the list. */
  onDone: () => void;
}

export interface EntitySave<TValues> {
  isEdit: boolean;
  onSubmit: (values: TValues) => Promise<void>;
}

/**
 * The create-or-update half of every module form: picks the mutation from whether a
 * row is being edited, reports the outcome through the shared notifier and hands
 * control back to the page. Pair with {@link EntityForm}, which renders the React
 * Hook Form wiring around the fields.
 */
export function useEntitySave<TValues, TRow>({
  label,
  initial,
  create,
  update,
  onDone,
}: UseEntitySaveOptions<TValues, TRow>): EntitySave<TValues> {
  const notify = useNotify();
  const isEdit = Boolean(initial);

  const onSubmit = async (values: TValues) => {
    try {
      if (initial) {
        await update(initial, values);
      } else {
        await create(values);
      }
      notify(`${label} ${isEdit ? 'updated' : 'created'}`);
      onDone();
    } catch (error) {
      notify(errorMessage(error, 'Save failed'), 'error');
    }
  };

  return { isEdit, onSubmit };
}
