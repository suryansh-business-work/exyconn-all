import { RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import { ClientStatus } from '@exyconn/shell/graphql/generated';
import { ClientSection } from './client-section';

/** Who the client is and how to reach them. */
export function ClientContactFields() {
  return (
    <ClientSection
      title="Contact"
      hint="Who you deal with. Name, company, email and phone are required."
    >
      <RhfTextField
        name="name"
        label="Name"
        required
        placeholder="e.g. Priya Sharma"
        helperText="The main contact person at the client."
      />
      <RhfTextField
        name="company"
        label="Company"
        required
        placeholder="e.g. Acme Pvt Ltd"
        helperText="The legal or trading name shown on invoices."
      />
      <RhfTextField
        name="email"
        label="Email"
        type="email"
        required
        placeholder="name@company.com"
        helperText="Invoices and client hub sign-in codes are sent here."
      />
      <RhfTextField
        name="phone"
        label="Phone"
        required
        placeholder="+91 98765 43210"
        helperText="Include the country code."
      />
      <RhfSelect
        name="status"
        label="Status"
        required
        options={enumOptions(Object.values(ClientStatus))}
        helperText="Prospect until work starts; Active while you invoice them."
      />
    </ClientSection>
  );
}
