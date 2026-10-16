import { useRef } from 'react';
import { CompanyForm } from '../../pages/companies/forms/company';
import type { CreatedRecord } from './QuickCreateSelect';

/** The company form in the side panel, for a dropdown's "Create Company". */
export function CreateCompanyPanel({
  done,
  cancel,
}: Readonly<{ done: (created: CreatedRecord) => void; cancel: () => void }>) {
  const created = useRef<CreatedRecord | null>(null);
  return (
    <CompanyForm
      initial={null}
      onCreated={(row) => {
        created.current = row;
      }}
      onDone={() => (created.current ? done(created.current) : cancel())}
      onCancel={cancel}
    />
  );
}
