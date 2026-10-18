import { ComposeEmailForm } from '../../detail/forms/compose-email';
import type { CommsPanel } from '../commsStore';

interface EmailPanelProps {
  panel: CommsPanel;
  onClose: () => void;
}

/** The record's email compose form, hosted in the dock so the page stays usable. */
export function EmailPanel({ panel, onClose }: Readonly<EmailPanelProps>) {
  const first = panel.emails[0];
  return (
    <ComposeEmailForm
      context={{ object: panel.object, id: panel.id, to: first ? [first] : [] }}
      memoryKey={panel.key}
      onDone={onClose}
      onCancel={onClose}
    />
  );
}
