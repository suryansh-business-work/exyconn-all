import { Flex } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';

/** Identity tab — the names and copy that describe the business. */
export function BrandingIdentityFields() {
  return (
    <Flex direction="column" spacing={2.5}>
      <RhfTextField
        name="businessName"
        label="Business name"
        helperText="Shown in the portal header, emails and the app."
      />
      <RhfTextField
        name="legalName"
        label="Legal name"
        helperText="Registered entity name, used on invoices and contracts."
      />
      <RhfTextField name="slogan" label="Slogan" helperText="One short line under the logo." />
      <RhfTextField name="description" label="Description" multiline minRows={3} />
    </Flex>
  );
}
