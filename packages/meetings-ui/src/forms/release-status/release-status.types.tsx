import type {
  MaReleaseFieldsFragment,
  MaReleaseStatus,
  MaReleaseStatusInput,
} from '@exyconn/shell/graphql/generated';

export type ReleaseRow = MaReleaseFieldsFragment;

/** The form's values; the store fields are '' when not given. */
export interface ReleaseStatusValues {
  status: MaReleaseStatus;
  note: string;
  storeItemId: string;
  storeUrl: string;
}

export type ReleaseStatusInput = MaReleaseStatusInput;
