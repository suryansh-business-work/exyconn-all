import {
  AudienceFilterEntity,
  AudienceFilterKind,
  AudienceRecordKind,
  AudienceRecordVia,
  AudienceRuleOperator,
  type AudienceCountsFieldsFragment,
  type AudienceRecipientFieldsFragment,
} from '@exyconn/shell/graphql/generated';
import type { FilterFieldEntry } from '../../../../src/pages/audiences/forms/audience-list/AudienceConditionValue';

/** Every audience figure, each a different number so a tile can be told from its neighbour. */
export function audienceCounts(
  overrides: Partial<AudienceCountsFieldsFragment> = {},
): AudienceCountsFieldsFragment {
  return {
    __typename: 'AudienceCounts',
    contacts: 120,
    companies: 30,
    clients: 5,
    recordsWithoutEmail: 7,
    rawEmails: 1500,
    duplicates: 40,
    uniqueEmails: 1460,
    invalid: 12,
    suppressed: 9,
    optedOut: 3,
    excluded: 6,
    eligible: 1430,
    ...overrides,
  };
}

export function recipientRow(
  overrides: Partial<AudienceRecipientFieldsFragment> = {},
): AudienceRecipientFieldsFragment {
  return {
    __typename: 'AudienceRecipient',
    email: 'priya@urbancafe.in',
    name: 'Priya Shah',
    company: 'Urban Café',
    label: 'Work',
    verification: 'VALID',
    exclusion: null,
    sources: [
      {
        __typename: 'AudienceRecipientOrigin',
        kind: AudienceRecordKind.Contact,
        id: 'c1',
        name: 'Priya Shah',
        via: AudienceRecordVia.Rules,
      },
    ],
    ...overrides,
  };
}

const ALL_TEXT_OPERATORS = [
  AudienceRuleOperator.Equals,
  AudienceRuleOperator.NotEquals,
  AudienceRuleOperator.Contains,
  AudienceRuleOperator.IsEmpty,
  AudienceRuleOperator.IsNotEmpty,
];

/** The filter catalogue the server would offer: text, enum, email status and activity fields. */
export const FILTER_FIELDS: FilterFieldEntry[] = [
  {
    __typename: 'AudienceFilterField',
    key: 'contact.city',
    label: 'Contact city',
    entity: AudienceFilterEntity.Contact,
    kind: AudienceFilterKind.Text,
    operators: ALL_TEXT_OPERATORS,
    values: [],
  },
  {
    __typename: 'AudienceFilterField',
    key: 'contact.status',
    label: 'Contact status',
    entity: AudienceFilterEntity.Contact,
    kind: AudienceFilterKind.Enum,
    operators: [AudienceRuleOperator.Equals, AudienceRuleOperator.NotEquals],
    values: ['ACTIVE', 'LEFT_COMPANY'],
  },
  {
    __typename: 'AudienceFilterField',
    key: 'email.status',
    label: 'Email status',
    entity: AudienceFilterEntity.Email,
    kind: AudienceFilterKind.EmailStatus,
    operators: [AudienceRuleOperator.Equals],
    values: ['VALID', 'RISKY'],
  },
  {
    __typename: 'AudienceFilterField',
    key: 'activity.lastContacted',
    label: 'Last contacted',
    entity: AudienceFilterEntity.Contact,
    kind: AudienceFilterKind.LastContacted,
    operators: [
      AudienceRuleOperator.WithinDays,
      AudienceRuleOperator.OlderThanDays,
      AudienceRuleOperator.Never,
    ],
    values: [],
  },
];
