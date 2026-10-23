import { useT } from '@exyconn/i18n';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { ComposeEmailForm } from '../../records/detail/forms/compose-email';

interface ComposeMailDialogProps {
  open: boolean;
  /** The mailbox it starts from: the one being looked at, else the first readable one. */
  fromAccountId: string;
  onClose: () => void;
}

/**
 * A new email from CRM > Mail, written in the shared CRM compose form and sent through the
 * CRM's send path. It is about no record yet; the timeline of whoever it reaches shows it.
 */
export function ComposeMailDialog({
  open,
  fromAccountId,
  onClose,
}: Readonly<ComposeMailDialogProps>) {
  const t = useT();
  return (
    <CrudDialog open={open} title={t('New email')} onClose={onClose}>
      {open && (
        <ComposeEmailForm
          context={{ object: 'CONTACT', id: '', to: [], fromAccountId }}
          onDone={onClose}
          onCancel={onClose}
        />
      )}
    </CrudDialog>
  );
}
