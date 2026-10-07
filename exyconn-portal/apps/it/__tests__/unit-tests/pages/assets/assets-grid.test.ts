import { describe, expect, it } from 'vitest';
import { AssetCategory, AssetStatus } from '@exyconn/shell/graphql/generated';
import { ASSET_COLUMNS } from '../../../../src/pages/assets/assets-grid';
import {
  ASSET_CATEGORIES,
  ASSET_STATUSES,
  isAssignedStatus,
} from '../../../../src/pages/assets/assets.constants';
import { assetRow } from '../../core/rows.fixtures';
import { actionKeys, formatCell, headersOf } from '../../core/grid.helpers';

describe('ASSET_COLUMNS', () => {
  it('reads tag, name, category, status, holder, serial, location and warranty', () => {
    expect(headersOf(ASSET_COLUMNS)).toEqual([
      'Tag',
      'Asset',
      'Category',
      'Status',
      'Assigned to',
      'Serial',
      'Location',
      'Warranty ends',
      '',
    ]);
    expect(actionKeys(ASSET_COLUMNS)).toEqual(['edit', 'delete']);
  });

  it('formats the warranty date, and leaves an unrecorded one blank', () => {
    expect(formatCell(ASSET_COLUMNS, 'warrantyExpiry', assetRow(), '2028-01-10')).toBe(
      'on 2028-01-10',
    );
    expect(formatCell(ASSET_COLUMNS, 'warrantyExpiry', assetRow(), null)).toBe('');
  });
});

describe('asset constants', () => {
  it('offers exactly the categories and statuses the server accepts', () => {
    expect(ASSET_CATEGORIES).toEqual(Object.values(AssetCategory));
    expect(ASSET_STATUSES).toEqual(Object.values(AssetStatus));
  });

  it('treats only ASSIGNED as having a holder', () => {
    expect(isAssignedStatus(AssetStatus.Assigned)).toBe(true);
    expect(isAssignedStatus(AssetStatus.InRepair)).toBe(false);
    expect(isAssignedStatus('')).toBe(false);
  });
});
