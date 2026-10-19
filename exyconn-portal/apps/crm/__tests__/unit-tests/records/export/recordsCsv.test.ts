import { describe, expect, it } from 'vitest';
import { CrmPropertyType } from '@exyconn/shell/graphql/generated';
import { exportProperties, recordColumns } from '../../../../src/records/export/recordsCsv';
import { choiceProperty, property, recordRow } from '../records-fixtures';

const t = ((text: string) => `T:${text}`) as never;

describe('exportProperties', () => {
  const name = property();
  const email = property({ key: 'email', label: 'Email' });

  it('exports every property when no keys are given', () => {
    const all = [name, email];
    const result = exportProperties(all, []);
    expect(result).toEqual(all);
    expect(result).not.toBe(all);
  });

  it('follows the given keys in order and skips unknown ones', () => {
    expect(exportProperties([name, email], ['email', 'gone', 'name'])).toEqual([email, name]);
  });
});

describe('recordColumns', () => {
  it('heads each column with the label and writes values the importer reads back', () => {
    const date = property({ key: 'due', label: 'Due', type: CrmPropertyType.Date });
    const count = property({ key: 'count', label: 'Count', type: CrmPropertyType.Number });
    const flag = property({ key: 'vip', label: 'VIP', type: CrmPropertyType.Boolean });
    const tier = choiceProperty({ G: 'Gold' }, { key: 'tier', label: 'Tier', builtIn: false });
    const columns = recordColumns([date, count, flag, tier], t);
    const row = recordRow({
      due: '2026-10-15T08:00:00.000Z',
      count: 1200.5,
      vip: true,
      custom: { tier: 'G' },
    });

    expect(columns.map((column) => column.header)).toEqual(['T:Due', 'T:Count', 'T:VIP', 'Tier']);
    expect(columns.map((column) => column.value(row))).toEqual([
      '2026-10-15',
      '1200.5',
      'Yes',
      'Gold',
    ]);
    expect(columns[2].value(recordRow({ vip: false }))).toBe('No');
  });

  it('writes a Date value as its calendar day', () => {
    const date = property({ key: 'due', type: CrmPropertyType.Date });
    const [column] = recordColumns([date], t);
    expect(column.value(recordRow({ due: new Date(2026, 9, 15, 23, 30) }))).toBe('2026-10-15');
  });
});
