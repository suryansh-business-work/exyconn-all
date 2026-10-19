import { describe, expect, it } from 'vitest';
import { CrmPropertyType } from '@exyconn/shell/graphql/generated';
import { propertyTableRows } from '../../../../src/pages/settings/property-rows';
import { propertyRow, schemaProperty } from './settings-fixtures';

const TWO_CHOICES = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
];

describe('propertyTableRows', () => {
  it('lists the custom properties first, then the built-in ones', () => {
    const custom = propertyRow({ id: 'prop-9', type: CrmPropertyType.Enum, options: TWO_CHOICES });
    const rows = propertyTableRows(
      [custom],
      [schemaProperty(), schemaProperty({ key: 'lead_score', builtIn: false })],
    );

    expect(rows).toEqual([
      {
        id: 'prop-9',
        key: 'lead_score',
        label: 'Lead score',
        type: CrmPropertyType.Enum,
        required: false,
        choices: 2,
        description: '',
        property: custom,
      },
      {
        id: 'built-in:name',
        key: 'name',
        label: 'Name',
        type: CrmPropertyType.Text,
        required: true,
        choices: null,
        description: 'Full name',
        property: null,
      },
    ]);
  });

  it('counts choices only on choice types', () => {
    const rows = propertyTableRows(
      [propertyRow({ type: CrmPropertyType.Text, options: TWO_CHOICES })],
      [schemaProperty({ key: 'stage', type: CrmPropertyType.Radio, options: TWO_CHOICES })],
    );

    expect(rows.map((row) => row.choices)).toEqual([null, 2]);
  });

  it('leaves out the filter-only checks, which records never hold', () => {
    const rows = propertyTableRows(
      [],
      [schemaProperty({ key: 'has_email', filterOnly: true }), schemaProperty()],
    );

    expect(rows.map((row) => row.key)).toEqual(['name']);
  });
});
