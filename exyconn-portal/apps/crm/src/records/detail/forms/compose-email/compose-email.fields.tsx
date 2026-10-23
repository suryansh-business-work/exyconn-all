import { useT } from '@exyconn/i18n';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { Button, Flex, TextField } from '@exyconn/shell/components/ui';
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

interface ComposeAiDraftProps {
  drafting: boolean;
  onDraft: () => void;
}

/** "Draft with AI" and the instruction it follows; only for an email about a record. */
export function ComposeAiDraft({ drafting, onDraft }: Readonly<ComposeAiDraftProps>) {
  const t = useT();
  return (
    <Flex direction="column" spacing={1}>
      <RhfTextField
        name="instruction"
        label="Ask the AI to write it"
        helperText="e.g. thank them for the call and propose a demo next week"
      />
      <Button
        size="small"
        variant="outlined"
        startIcon={<AutoAwesomeIcon />}
        onClick={onDraft}
        loading={drafting}
        sx={{ alignSelf: 'flex-start' }}
      >
        {t('Draft with AI')}
      </Button>
    </Flex>
  );
}
