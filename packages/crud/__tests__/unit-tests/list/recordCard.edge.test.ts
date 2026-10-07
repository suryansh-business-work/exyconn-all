import { describe, expect, it } from 'vitest';
import { derivedColumn, textColumn } from '../../../src/grid/columns';
import { toRecordCard } from '../../../src/list/recordCard';

interface Row {
  reference: string | null;
  owner: string | null;
  status: string;
}

const context = { t: (source: string) => source };

describe('toRecordCard edge cases', () => {
  it('gives a card with no columns an empty title and no facts', () => {
    expect(toRecordCard<Row>([], { reference: 'A', owner: 'B', status: 'OPEN' }, context)).toEqual({
      title: '',
      fields: [],
    });
  });

  it('reads a missing heading value as an empty title and drops empty facts', () => {
    const card = toRecordCard<Row>(
      [textColumn<Row>('reference', 'Ref'), textColumn<Row>('owner', 'Owner')],
      { reference: null, owner: null, status: 'OPEN' },
      context,
    );
    expect(card).toEqual({ title: '', fields: [] });
  });

  it('keys a fact by its column id, else its field', () => {
    const card = toRecordCard<Row>(
      [
        textColumn<Row>('reference', 'Ref'),
        derivedColumn<Row>('who', 'Who', (row) => row.owner ?? ''),
        textColumn<Row>('status', 'Status'),
      ],
      { reference: 'NC-1', owner: 'Asha', status: 'OPEN' },
      context,
    );
    expect(card.fields.map((field) => field.key)).toEqual(['who', 'status']);
  });

  it('keys a fact with neither id nor field by its place among the facts', () => {
    const card = toRecordCard<Row>(
      [textColumn<Row>('reference', 'Ref'), { headerName: 'Note', valueFormatter: () => 'Hi' }],
      { reference: 'NC-1', owner: null, status: 'OPEN' },
      context,
    );
    expect(card.fields).toEqual([{ key: '0', label: 'Note', value: 'Hi', chip: false }]);
  });
});
