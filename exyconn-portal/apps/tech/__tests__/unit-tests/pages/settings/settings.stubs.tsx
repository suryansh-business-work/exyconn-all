import { vi } from 'vitest';
import type { SelectOption } from '@exyconn/shell/components/form/rhf';
import type { TrackerNotificationsFormValues } from '../../../../src/pages/settings/forms/tracker-notifications';

export interface FormProps {
  options: SelectOption[];
  initial: TrackerNotificationsFormValues;
  onDone: () => void;
  onCancel: () => void;
}

/** Every render of the form stand-in, with the props it was given. */
export const formRenders = vi.fn<(props: FormProps) => void>();

/** Stands in for the channel form: lists the options it was offered and exposes its callbacks. */
export function TrackerNotificationsFormStub(props: Readonly<FormProps>) {
  formRenders(props);
  return (
    <div>
      <ul aria-label="channel options">
        {props.options.map((option) => (
          <li key={option.value}>{option.label}</li>
        ))}
      </ul>
      <button type="button" onClick={props.onDone}>
        Form done
      </button>
      <button type="button" onClick={props.onCancel}>
        Form cancel
      </button>
    </div>
  );
}
