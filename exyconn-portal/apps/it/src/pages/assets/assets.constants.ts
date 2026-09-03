import { AssetCategory, AssetStatus } from '@exyconn/shell/graphql/generated';

/** Mirrors the server enums so the form offers exactly what the schema accepts. */
export const ASSET_CATEGORIES = Object.values(AssetCategory);
export const ASSET_STATUSES = Object.values(AssetStatus);

/** An asset only has a holder while it is assigned, so the picker is hidden otherwise. */
export const isAssignedStatus = (status: string) => status === AssetStatus.Assigned;
