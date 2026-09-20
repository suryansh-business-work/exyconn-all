import { useController, useFormContext } from 'react-hook-form';
import { AttachmentPicker } from './AttachmentPicker';
import type { AttachmentItem } from './AttachmentList';

interface RhfAttachmentPickerProps {
  name: string;
  /** Groups the uploads on the CDN, e.g. "compliance". */
  folder: string;
}

/**
 * The attachment picker as a form field.
 *
 * The support reply keeps its files in its own `useState` because the reply is sent and
 * forgotten. A record that is edited again needs them in the form's own values, so what is
 * already attached comes back when somebody reopens it — that is what a controller gives.
 */
export function RhfAttachmentPicker({ name, folder }: Readonly<RhfAttachmentPickerProps>) {
  const { control } = useFormContext();
  const { field } = useController({ name, control });
  const value = (field.value ?? []) as AttachmentItem[];

  return (
    <AttachmentPicker value={value} onChange={(next) => field.onChange(next)} folder={folder} />
  );
}
