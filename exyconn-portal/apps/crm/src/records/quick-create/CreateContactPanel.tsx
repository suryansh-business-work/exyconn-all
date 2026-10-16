import { useRef } from 'react';
import { ContactForm } from '../../pages/contacts/forms/contact';
import type { CreatedRecord } from './QuickCreateSelect';

/** The contact form in the side panel, for a dropdown's "Create Contact". */
export function CreateContactPanel({
  done,
  cancel,
}: Readonly<{ done: (created: CreatedRecord) => void; cancel: () => void }>) {
  const created = useRef<CreatedRecord | null>(null);
  return (
    <ContactForm
      initial={null}
      onCreated={(row) => {
        created.current = row;
      }}
      onDone={() => (created.current ? done(created.current) : cancel())}
      onCancel={cancel}
    />
  );
}
