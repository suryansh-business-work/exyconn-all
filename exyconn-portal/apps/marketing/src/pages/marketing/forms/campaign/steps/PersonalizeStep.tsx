import { Controller, useFormContext } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import { Alert, Flex, Grid, Text } from '@exyconn/shell/components/ui';
import { CaretTextField } from '../design/CaretTextField';
import { PreviewPane } from '../design/PreviewPane';
import { PreviewAsField, type PreviewRecord } from '../personalize/PreviewAsField';
import type { CampaignPreviewState } from '../design/useCampaignPreview';
import type { CampaignStudioValues } from '../campaign.types';
import type { StudioOptions } from '../studio/useStudioOptions';

interface PersonalizeStepProps {
  options: StudioOptions;
  preview: CampaignPreviewState;
  previewRecord: PreviewRecord | null;
  onPreviewRecord: (record: PreviewRecord | null) => void;
}

/** Subject and preview text with variables, checked against a real recipient. */
export function PersonalizeStep({
  options,
  preview,
  previewRecord,
  onPreviewRecord,
}: Readonly<PersonalizeStepProps>) {
  const t = useT();
  const { control } = useFormContext<CampaignStudioValues>();
  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, lg: 5 }}>
        <Flex direction="column" spacing={2}>
          <PreviewAsField value={previewRecord} onChange={onPreviewRecord} />
          <Alert severity="info">
            {t(
              'When an address belongs to several records, its details come from one record, always chosen the same way: a contact picked by hand, then a contact matched by the rules, then a linked contact, then a client, then the company.',
            )}
          </Alert>
          <Controller
            name="subject"
            control={control}
            render={({ field, fieldState }) => (
              <Flex direction="column" spacing={0.5}>
                <CaretTextField
                  label="Email subject"
                  value={field.value}
                  onChange={field.onChange}
                  variables={options.variables}
                />
                {fieldState.error?.message && (
                  <Text size="caption" color="error" role="alert">
                    {t(fieldState.error.message)}
                  </Text>
                )}
              </Flex>
            )}
          />
          <Controller
            name="preheader"
            control={control}
            render={({ field }) => (
              <CaretTextField
                label="Preview text"
                value={field.value}
                onChange={field.onChange}
                variables={options.variables}
              />
            )}
          />
          <Text size="caption" color="text.secondary">
            {t(
              'Add a fallback after a bar for values that may be empty, e.g. {example} reads “Hi there” when the first name is missing. CRM values are always escaped, so they cannot change the email’s markup.',
              {
                example: '{{contact.firstName|there}}',
              },
            )}
          </Text>
        </Flex>
      </Grid>
      <Grid size={{ xs: 12, lg: 7 }}>
        <PreviewPane state={preview} />
      </Grid>
    </Grid>
  );
}
