import { useFormContext, useWatch } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import { Alert } from '@exyconn/shell/components/ui';
import {
  RhfMultiSelect,
  RhfRadioGroup,
  type SelectOption,
} from '@exyconn/shell/components/form/rhf';
import { AudienceEmailSelection } from '@exyconn/shell/graphql/generated';
import { BuilderSection } from './BuilderSection';
import { EMAIL_SELECTION_OPTIONS } from './audience-list.options';
import type { AudienceFormValues } from './audience-list.types';

interface AudienceEmailSectionProps {
  /** Address labels in use across the CRM, from the server. */
  emailTypes: readonly string[];
}

/** How many of each record's addresses the audience uses. */
export function AudienceEmailSection({ emailTypes }: Readonly<AudienceEmailSectionProps>) {
  const t = useT();
  const { control } = useFormContext<AudienceFormValues>();
  const selection = useWatch({ control, name: 'emailSelection' });
  const typeOptions: SelectOption[] = emailTypes.map((type) => ({ value: type, label: type }));
  return (
    <BuilderSection
      title="Email address selection"
      hint="Choose whether to use one preferred email or multiple eligible email addresses per record."
    >
      <RhfRadioGroup
        name="emailSelection"
        label="Addresses per record"
        options={EMAIL_SELECTION_OPTIONS}
        helperText="Recommended default: one preferred, deliverable email address for each recipient."
      />
      {selection === AudienceEmailSelection.All && (
        <Alert severity="warning">
          {t(
            'The same person may receive this campaign in several of their inboxes. Each address still gets one copy at most.',
          )}
        </Alert>
      )}
      {selection === AudienceEmailSelection.SelectedTypes && (
        <RhfMultiSelect
          name="emailTypes"
          label="Email types"
          options={typeOptions}
          helperText={
            typeOptions.length
              ? 'Only addresses with these labels are used, e.g. Sales or Support.'
              : 'No labelled addresses in the CRM yet — add labels to contact or company emails first.'
          }
        />
      )}
      <Alert severity="info">
        {t(
          'Unsubscribed, blocked, bounced, and do-not-contact addresses will never be added to a campaign send. Email verification checks deliverability; it does not establish marketing consent.',
        )}
      </Alert>
    </BuilderSection>
  );
}
