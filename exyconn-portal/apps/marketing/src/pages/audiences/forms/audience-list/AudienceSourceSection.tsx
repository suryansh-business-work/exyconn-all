import { useId } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import { FormHelperText, ToggleButton, ToggleButtonGroup } from '@exyconn/shell/components/ui';
import { RhfRadioGroup } from '@exyconn/shell/components/form/rhf';
import { AudienceRecipientSource } from '@exyconn/shell/graphql/generated';
import { BuilderSection } from './BuilderSection';
import { COMPANY_EMAIL_OPTIONS, RECIPIENT_SOURCE_OPTIONS } from './audience-list.options';
import type { AudienceFormValues } from './audience-list.types';

const COMPANY_SOURCES: ReadonlySet<AudienceRecipientSource> = new Set([
  AudienceRecipientSource.Companies,
  AudienceRecipientSource.Both,
]);

/** Which CRM registers the audience draws from, and how companies turn into addresses. */
export function AudienceSourceSection() {
  const t = useT();
  const hintId = useId();
  const { control } = useFormContext<AudienceFormValues>();
  const source = useWatch({ control, name: 'recipientSource' });
  return (
    <BuilderSection
      title="Recipient source"
      hint="Select Contacts, Companies, or Both. Combined audiences automatically remove duplicate email recipients."
    >
      <Controller
        name="recipientSource"
        control={control}
        render={({ field }) => (
          <ToggleButtonGroup
            exclusive
            fullWidth
            size="small"
            color="primary"
            aria-label={t('Recipient source')}
            aria-describedby={hintId}
            value={field.value}
            onChange={(_event, value: AudienceRecipientSource | null) =>
              value && field.onChange(value)
            }
            sx={{ flexWrap: { xs: 'wrap', sm: 'nowrap' } }}
          >
            {RECIPIENT_SOURCE_OPTIONS.map((option) => (
              <ToggleButton key={option.value} value={option.value}>
                {t(option.label)}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        )}
      />
      <FormHelperText id={hintId}>
        {t(
          source === AudienceRecipientSource.SelectedOnly
            ? 'Only the records you pick under Data sources are used; the rules below are ignored.'
            : 'Records that match the rules below. Records picked under Data sources are always added.',
        )}
      </FormHelperText>
      {COMPANY_SOURCES.has(source) && (
        <RhfRadioGroup
          name="companyEmailSource"
          label="Company email sources"
          options={COMPANY_EMAIL_OPTIONS}
          helperText="Choose whether to include company mailboxes, employee emails or both."
        />
      )}
    </BuilderSection>
  );
}
