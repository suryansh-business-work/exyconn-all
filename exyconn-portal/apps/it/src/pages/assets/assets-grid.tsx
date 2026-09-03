import type { ColDef } from 'ag-grid-community';
import {
  actionsColumn,
  dateColumn,
  statusColumn,
  textColumn,
  type CrudGridContext,
} from '@exyconn/crud';
import type { ListAssetsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedAssetRow = ListAssetsPagedQuery['listAssetsPaged']['rows'][number];

/** Row handlers ag-grid hands to the shared action cells via its `context`. */
export type AssetsGridContext = CrudGridContext<PagedAssetRow>;

/**
 * Column model for the server-side asset register. Tag, name, serial, holder and
 * manufacturer are what IT searches by, so those are the server-filtered ones.
 */
export const ASSET_COLUMNS: ColDef<PagedAssetRow>[] = [
  textColumn('assetTag', 'Tag'),
  textColumn('name', 'Asset'),
  statusColumn('category', 'Category'),
  statusColumn('status', 'Status'),
  textColumn('assignedToName', 'Assigned to'),
  textColumn('serialNumber', 'Serial'),
  textColumn('location', 'Location'),
  dateColumn('warrantyExpiry', 'Warranty ends'),
  actionsColumn(),
];
