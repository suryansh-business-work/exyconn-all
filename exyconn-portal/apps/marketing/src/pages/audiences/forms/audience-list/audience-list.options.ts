import type { RadioChoice } from '@exyconn/shell/components/form/rhf';
import {
  AudienceCompanyEmailSource,
  AudienceEmailSelection,
  AudienceRecipientSource,
  AudienceRuleOperator,
  AudienceUpdateMode,
} from '@exyconn/shell/graphql/generated';

/** The segmented choice at the top of the builder. English labels are translation keys. */
export const RECIPIENT_SOURCE_OPTIONS: ReadonlyArray<{
  value: AudienceRecipientSource;
  label: string;
}> = [
  { value: AudienceRecipientSource.Contacts, label: 'Contacts' },
  { value: AudienceRecipientSource.Companies, label: 'Companies' },
  { value: AudienceRecipientSource.Both, label: 'Both' },
  { value: AudienceRecipientSource.SelectedOnly, label: 'Picked records only' },
];

export const COMPANY_EMAIL_OPTIONS: readonly RadioChoice[] = [
  {
    value: AudienceCompanyEmailSource.CompanyEmails,
    label: 'Company emails only',
    description: 'The company’s own mailboxes, such as info@ or sales@.',
  },
  {
    value: AudienceCompanyEmailSource.LinkedContacts,
    label: 'Linked company contacts only',
    description: 'Include email addresses from contacts linked to matching companies.',
  },
  {
    value: AudienceCompanyEmailSource.Both,
    label: 'Both company emails and linked contacts',
    description:
      'Example: a company with info@company.com and 3 employees can contribute up to 4 addresses.',
    recommended: true,
  },
];

export const EMAIL_SELECTION_OPTIONS: readonly RadioChoice[] = [
  {
    value: AudienceEmailSelection.Primary,
    label: 'Preferred / primary email per recipient',
    description: 'One deliverable address per record: the primary, or the next eligible one.',
    recommended: true,
  },
  {
    value: AudienceEmailSelection.All,
    label: 'All eligible email addresses',
    description: 'Every eligible address on each record.',
  },
  {
    value: AudienceEmailSelection.SelectedTypes,
    label: 'Selected email types',
    description: 'Only addresses with the labels you choose, such as Sales or Support.',
  },
];

export const UPDATE_MODE_OPTIONS: readonly RadioChoice[] = [
  {
    value: AudienceUpdateMode.Dynamic,
    label: 'Live dynamic audience',
    description: 'Audience membership automatically follows changes in CRM data and saved filters.',
    recommended: true,
  },
  {
    value: AudienceUpdateMode.FixedSnapshot,
    label: 'Fixed snapshot',
    description:
      'Recipient email addresses are frozen when the audience is saved. CRM additions and edits won’t automatically change this list.',
  },
  {
    value: AudienceUpdateMode.FixedRecords,
    label: 'Fixed records, latest emails',
    description:
      'The matching contacts and companies are frozen when saved; each send uses their current eligible addresses.',
  },
];

export const OPERATOR_LABELS: Readonly<Record<AudienceRuleOperator, string>> = {
  [AudienceRuleOperator.Equals]: 'is',
  [AudienceRuleOperator.NotEquals]: 'is not',
  [AudienceRuleOperator.Contains]: 'contains',
  [AudienceRuleOperator.IsEmpty]: 'is empty',
  [AudienceRuleOperator.IsNotEmpty]: 'is not empty',
  [AudienceRuleOperator.Never]: 'never',
  [AudienceRuleOperator.WithinDays]: 'within the last (days)',
  [AudienceRuleOperator.OlderThanDays]: 'more than (days) ago',
};
