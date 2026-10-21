import { useT } from '@exyconn/i18n';
import { TextField } from '@exyconn/shell/components/ui';
import { RhfChipsInput, RhfTextField } from '@exyconn/shell/components/form/rhf';

interface ComposeAddressFieldsProps {
  /** The recipients shown read-only when they are locked. */
  to: string[];
  /** The recipient is fixed (a cold email goes to the draft's address). */
  recipientsLocked?: boolean;
}

/** Who the email goes to and its subject. Hoisted out of the form to keep it small. */
export function ComposeAddressFields({
  to,
  recipientsLocked,
}: Readonly<ComposeAddressFieldsProps>) {
  const t = useT();
  return (
    <>
      {recipientsLocked ? (
        <TextField
          label={t('To')}
          value={to.join(', ')}
          slotProps={{ input: { readOnly: true } }}
        />
      ) : (
        <>
          <RhfChipsInput name="to" label="To" helperText="Type an address and press Enter" />
          <RhfChipsInput
            name="cc"
            label="Cc"
            helperText="Optional. Others who get a copy; type an address and press Enter."
          />
        </>
      )}
      <RhfTextField
        name="subject"
        label="Subject"
        helperText="What they see in their inbox, up to 300 characters."
      />
    </>
  );
}
