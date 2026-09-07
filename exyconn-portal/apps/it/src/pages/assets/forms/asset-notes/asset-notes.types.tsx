import type { AssetFieldsFragment } from '@exyconn/shell/graphql/generated';

/** The asset the notes belong to. Every other field is resent unchanged on save. */
export type AssetNotesRow = AssetFieldsFragment;

export interface AssetNotesFormValues {
  notes: string;
}
