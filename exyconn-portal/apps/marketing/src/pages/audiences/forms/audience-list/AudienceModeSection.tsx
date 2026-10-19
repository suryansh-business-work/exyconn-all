import { useFormContext, useWatch } from 'react-hook-form';
import { useFormatters, useT } from '@exyconn/i18n';
import { Text } from '@exyconn/shell/components/ui';
import { RhfRadioGroup } from '@exyconn/shell/components/form/rhf';
import { AudienceUpdateMode } from '@exyconn/shell/graphql/generated';
import { BuilderSection } from './BuilderSection';
import { UPDATE_MODE_OPTIONS } from './audience-list.options';
import type { AudienceFormValues } from './audience-list.types';

interface AudienceModeSectionProps {
  /** When the saved audience was frozen; null for a new or dynamic one. */
  snapshotAt: string | null;
}

/** Whether the audience follows the CRM or keeps what it matched when saved. */
export function AudienceModeSection({ snapshotAt }: Readonly<AudienceModeSectionProps>) {
  const t = useT();
  const { formatDateTime } = useFormatters();
  const { control } = useFormContext<AudienceFormValues>();
  const mode = useWatch({ control, name: 'updateMode' });
  const fixed = mode !== AudienceUpdateMode.Dynamic;
  return (
    <BuilderSection title="Audience update mode">
      <RhfRadioGroup
        name="updateMode"
        label="When the CRM changes"
        options={UPDATE_MODE_OPTIONS}
        helperText="Unsubscribes and blocks are always respected, whichever mode you choose."
      />
      {fixed && (
        <Text size="sm" color="text.secondary">
          {snapshotAt
            ? t('Frozen on {date}. Saving again takes a new snapshot from the counts below.', {
                date: formatDateTime(snapshotAt),
              })
            : t('Saving freezes the audience exactly as the counts below show it.')}
        </Text>
      )}
    </BuilderSection>
  );
}
