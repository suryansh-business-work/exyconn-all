import { useT } from '@exyconn/i18n';
import { RhfSwitch } from '@exyconn/shell/components/form/rhf';
import { Divider, Flex, Text } from '@exyconn/shell/components/ui';
import { CountedField } from './CountedField';
import { SetRows } from './SetRows';

/** The longest editor note (schema.ts `common.note`). */
const NOTE_MAX = 300;

/** Fields every node carries: variables set on entry, the completion flag and a note. */
export function CommonFields() {
  const t = useT();
  return (
    <Flex direction="column" spacing={1.5}>
      <Divider />
      <Text size="label" weight="semibold">
        {t('Every node')}
      </Text>
      <SetRows name="set" title="Set variables when this node is reached" />
      <RhfSwitch name="complete" label="Reaching this node completes the workflow" />
      <CountedField
        name="note"
        label="Note for editors"
        max={NOTE_MAX}
        multiline
        hint="Only shown here, never to the customer"
      />
    </Flex>
  );
}
