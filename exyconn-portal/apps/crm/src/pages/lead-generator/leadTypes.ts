import type {
  FindLeadEmailsMutation,
  ImportLeadsToCrmMutation,
  LeadPlaceFieldsFragment,
} from '@exyconn/shell/graphql/generated';

export type LeadPlace = LeadPlaceFieldsFragment;
export type LeadImportResult = ImportLeadsToCrmMutation['importLeadsToCrm'];

/** A website lookup that is still running, or what it found. */
export type EmailLookup = { status: 'PENDING' } | FindLeadEmailsMutation['findLeadEmails'];
