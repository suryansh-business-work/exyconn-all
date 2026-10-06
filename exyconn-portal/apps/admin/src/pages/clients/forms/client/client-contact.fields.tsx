import { RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import { ClientStatus } from '@exyconn/shell/graphql/generated';
import { ClientSection } from './client-section';

/** Who the client is and how to reach them. */
export function ClientContactFields() {
  return (
    <ClientSection title="Contact">
      <RhfTextField name="name" label="Name" />
      <RhfTextField name="email" label="Email" type="email" />
      <RhfTextField name="phone" label="Phone" />
      <RhfTextField name="company" label="Company" />
      <RhfSelect name="status" label="Status" options={enumOptions(Object.values(ClientStatus))} />
    </ClientSection>
  );
}
