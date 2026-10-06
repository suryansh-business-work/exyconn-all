import type { CmsAssetFieldsFragment } from '@exyconn/shell/graphql/generated';

/** The file whose alt text is edited. */
export type AssetAltRow = Pick<CmsAssetFieldsFragment, 'id' | 'name' | 'alt'>;

export interface AssetAltFormValues {
  alt: string;
}
