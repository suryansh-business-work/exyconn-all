import type {
  FindLeadEmailsMutation,
  ImportLeadsToCrmMutation,
  LeadImportExtraFieldsFragment,
  LeadPlaceFieldsFragment,
  PreviewLeadImportQuery,
} from '@exyconn/shell/graphql/generated';

export type LeadPlace = LeadPlaceFieldsFragment;
export type LeadImportResult = ImportLeadsToCrmMutation['importLeadsToCrm'];
export type LeadImportPreview = PreviewLeadImportQuery['previewLeadImport'][number];
export type LeadImportExtra = LeadImportExtraFieldsFragment;

/** A website lookup that is still running, or what it found. */
export type EmailLookup = { status: 'PENDING' } | FindLeadEmailsMutation['findLeadEmails'];
