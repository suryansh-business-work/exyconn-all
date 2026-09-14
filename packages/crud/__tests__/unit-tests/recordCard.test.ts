import { describe, expect, it } from 'vitest';
import {
  actionsColumn,
  boolColumn,
  dateColumn,
  derivedColumn,
  statusColumn,
  textColumn,
  valueColumn,
} from '../../src/grid/columns';
import { cardActionSpecs, toRecordCard } from '../../src/list/recordCard';

interface Row {
  reference: string;
  title: string;
  owner: string;
  status: string;
  amount: number;
  active: boolean;
  dueDate: string | null;
  note: string;
}

const row: Row = {
  reference: 'NC-0001',
  title: 'Access rights were not reviewed',
  owner: 'Asha',
  status: 'OPEN',
  amount: 1500,
  active: true,
  dueDate: '2026-10-02',
  note: '',
};

const columns = [
  textColumn<Row>('reference', 'Ref'),
  textColumn<Row>('title', 'Finding'),
  statusColumn<Row>('status', 'Status'),
  textColumn<Row>('owner', 'Owner'),
  valueColumn<Row>('amount', 'Amount', (r) => `${r.amount} USD`),
  boolColumn<Row>('active', 'Active'),
  dateColumn<Row>('dueDate', 'Due'),
  derivedColumn<Row>('note', 'Note', (r) => r.note),
  actionsColumn<Row>(),
];

/** The page puts the viewer's date format on the grid context; the card reads the same one. */
const context = {
  actions: {},
  // Every grid, card list and export carries the viewer's translator (gridContextWith).
  t: (source: string) => source,
  formatDate: (iso: string) => `on ${iso}`,
};

describe('a record as a card', () => {
  it('leads with the first column and reads the rest the way the table does', () => {
    const card = toRecordCard(columns, row, context);

    expect(card.title).toBe('NC-0001');
    expect(card.fields.map((field) => [field.label, field.value])).toEqual([
      ['Finding', 'Access rights were not reviewed'],
      ['Status', 'OPEN'],
      ['Owner', 'Asha'],
      ['Amount', '1500 USD'],
      ['Active', 'true'],
    ]);
  });

  it('draws the columns the table draws as chips as chips', () => {
    const card = toRecordCard(columns, row, context);
    const chips = card.fields.filter((field) => field.chip).map((field) => field.label);

    expect(chips).toEqual(['Status', 'Active']);
  });

  it('leaves out what this row has nothing to say about', () => {
    const card = toRecordCard([textColumn<Row>('title', 'Finding'), ...columns], row, context);

    expect(card.fields.map((field) => field.label)).not.toContain('Note');
  });

  it('keeps where the record stands, even on a register too wide to show it', () => {
    // Status is the ninth column here, well past what fits on a card.
    const wide = [
      textColumn<Row>('reference', 'Ref'),
      textColumn<Row>('title', 'Finding'),
      textColumn<Row>('owner', 'Owner'),
      valueColumn<Row>('amount', 'Amount', (r) => `${r.amount} USD`),
      boolColumn<Row>('active', 'Active'),
      dateColumn<Row>('dueDate', 'Due'),
      derivedColumn<Row>('subject', 'Subject', () => 'Endpoints'),
      statusColumn<Row>('status', 'Status'),
    ];

    const card = toRecordCard(wide, row, context);

    expect(card.fields.map((field) => field.label)).toContain('Status');
    expect(card.fields.at(-1)).toMatchObject({ label: 'Status', value: 'OPEN', chip: true });
  });

  it('never grows past a glance, however many columns the table has', () => {
    const card = toRecordCard(columns, row, context);

    expect(card.fields.length).toBeLessThanOrEqual(5);
  });

  it('takes its buttons from the column the table pins to the right', () => {
    expect(cardActionSpecs(columns).map((spec) => spec.key)).toEqual(['edit', 'delete']);
    expect(cardActionSpecs([textColumn<Row>('title', 'Finding')])).toEqual([]);
  });
});
