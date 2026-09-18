import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { DecisionForm } from './decision.form';
import type { DecideHandler } from './decision.types';

interface DecisionDialogProps {
  /** What is being decided, e.g. the request's title. Null keeps the dialog closed. */
  title: string | null;
  onDecide: DecideHandler;
  onClose: () => void;
  onDecided: () => void;
}

/** The approve / reject drawer every IT workflow opens from its row action. */
export function DecisionDialog({
  title,
  onDecide,
  onClose,
  onDecided,
}: Readonly<DecisionDialogProps>) {
  if (title === null) {
    return null;
  }
  return (
    <CrudDialog open title={title} onClose={onClose}>
      <DecisionForm
        onDecide={onDecide}
        onCancel={onClose}
        onDone={() => {
          onClose();
          onDecided();
        }}
      />
    </CrudDialog>
  );
}
