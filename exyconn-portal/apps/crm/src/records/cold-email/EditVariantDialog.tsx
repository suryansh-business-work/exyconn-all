import { useT } from '@exyconn/i18n';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import type { ColdEmailVariantFieldsFragment } from '@exyconn/shell/graphql/generated';
import { EditVariantForm } from './forms/edit-variant';

interface EditVariantDialogProps {
  draftId: string;
  /** The version being edited; null keeps the dialog closed. */
  variant: ColdEmailVariantFieldsFragment | null;
  onClose: () => void;
}

/** Editing one unsent version's subject and message, in a dialog over the current page. */
export function EditVariantDialog({ draftId, variant, onClose }: Readonly<EditVariantDialogProps>) {
  const t = useT();
  return (
    <CrudDialog open={variant !== null} title={t('Edit version')} onClose={onClose}>
      {variant && (
        <EditVariantForm draftId={draftId} variant={variant} onDone={onClose} onCancel={onClose} />
      )}
    </CrudDialog>
  );
}
