import { describe, expect, it } from 'vitest';
import { AssetCategory, AssetEdrStatus, AssetStatus } from '@exyconn/shell/graphql/generated';
import {
  assetSchema,
  toAssetInput,
  toAssetValues,
} from '../../../../../../src/pages/assets/forms/asset';
import { assetRow } from '../../../../core/rows.fixtures';

const firstError = (value: object) => {
  const result = assetSchema.safeParse(value);
  return result.success ? null : result.error.issues[0]?.message;
};

const valid = { ...toAssetValues(null), assetTag: 'LT-001', name: 'ThinkPad' };
const nameFor = (id: string) => (id === 'emp-1' ? 'Ana Rao' : '');

describe('assetSchema', () => {
  it('accepts a new laptop in stock', () => {
    expect(firstError(valid)).toBeNull();
  });

  it('needs a tag of at most 40 characters and a name', () => {
    expect(firstError({ ...valid, assetTag: ' ' })).toBe('Asset tag is required');
    expect(firstError({ ...valid, assetTag: 'T'.repeat(41) })).toBe('Asset tag is too long');
    expect(firstError({ ...valid, name: '' })).toBe('Name is required');
  });

  it('reads the cost as a number and refuses a negative or non-numeric one', () => {
    const parsed = assetSchema.parse({ ...valid, purchaseCost: '899.5' });
    expect(parsed.purchaseCost).toBe(899.5);
    expect(firstError({ ...valid, purchaseCost: -1 })).toBe('Cost cannot be negative');
    expect(firstError({ ...valid, purchaseCost: 'lots' })).toBe('Cost must be a number');
  });

  it('keeps each installed software name under 80 characters', () => {
    expect(firstError({ ...valid, installedSoftware: ['x'.repeat(81)] })).toBe(
      'Keep each name under 80 characters',
    );
  });

  it('will not leave an assigned asset without a holder', () => {
    expect(firstError({ ...valid, status: AssetStatus.Assigned })).toBe(
      'Choose who the asset is assigned to',
    );
    expect(
      firstError({ ...valid, status: AssetStatus.Assigned, assignedToId: 'emp-1' }),
    ).toBeNull();
  });
});

describe('toAssetInput', () => {
  it('names the holder of an assigned asset', () => {
    const input = toAssetInput(
      { ...valid, status: AssetStatus.Assigned, assignedToId: 'emp-1' },
      nameFor,
    );
    expect(input).toMatchObject({ assignedToId: 'emp-1', assignedToName: 'Ana Rao' });
  });

  it('clears a stale holder from an asset that is not assigned', () => {
    const input = toAssetInput({ ...valid, assignedToId: 'emp-1' }, nameFor);
    expect(input).toMatchObject({ assignedToId: '', assignedToName: '' });
  });

  it('sends unrecorded dates as null and recorded ones as they are', () => {
    expect(toAssetInput(valid, nameFor)).toMatchObject({
      purchaseDate: null,
      warrantyExpiry: null,
      edrCheckedAt: null,
    });
    const dated = { ...valid, purchaseDate: '2025-01-10', warrantyExpiry: '2028-01-10' };
    expect(toAssetInput({ ...dated, edrCheckedAt: '2026-09-01' }, nameFor)).toMatchObject({
      purchaseDate: '2025-01-10',
      warrantyExpiry: '2028-01-10',
      edrCheckedAt: '2026-09-01',
    });
  });
});

describe('toAssetValues', () => {
  it('starts a new asset as a laptop in stock with no EDR expected', () => {
    expect(toAssetValues(null)).toMatchObject({
      category: AssetCategory.Laptop,
      status: AssetStatus.InStock,
      edrStatus: AssetEdrStatus.NotApplicable,
      purchaseCost: 0,
      installedSoftware: [],
      purchaseDate: '',
    });
  });

  it('loads a saved asset, turning missing dates into blanks', () => {
    const row = assetRow({ purchaseDate: null, warrantyExpiry: null, edrCheckedAt: null });
    expect(toAssetValues(row)).toEqual({
      assetTag: 'LT-001',
      name: 'ThinkPad X1',
      category: AssetCategory.Laptop,
      status: AssetStatus.InStock,
      manufacturer: 'Lenovo',
      modelName: 'X1 Carbon',
      serialNumber: 'SN-42',
      assignedToId: '',
      location: 'Pune',
      purchaseDate: '',
      warrantyExpiry: '',
      purchaseCost: 1500,
      notes: 'Keyboard replaced',
      installedSoftware: ['Office'],
      edrStatus: AssetEdrStatus.Protected,
      edrCheckedAt: '',
    });
  });
});
