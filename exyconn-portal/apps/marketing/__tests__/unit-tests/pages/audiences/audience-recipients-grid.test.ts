import { describe, expect, it } from 'vitest';
import type { ValueGetterParams } from 'ag-grid-community';
import {
  AudienceExclusionReason,
  AudienceRecordKind,
  AudienceRecordVia,
} from '@exyconn/shell/graphql/generated';
import {
  RECIPIENT_COLUMNS,
  type RecipientRow,
} from '../../../../src/pages/audiences/audience-recipients-grid';
import { columnIds, formatCell } from '../../grid-helpers';
import { recipientRow } from './audience.fixtures';

/** The chip value a derived status column hands its cell. */
const statusOf = (colId: string, row: RecipientRow | undefined) => {
  const column = RECIPIENT_COLUMNS.find((c) => c.colId === colId);
  const getter = column?.valueGetter as (params: ValueGetterParams<RecipientRow>) => unknown;
  return getter({ data: row, context: {} } as ValueGetterParams<RecipientRow>);
};

describe('RECIPIENT_COLUMNS', () => {
  it('lists one column per thing a reviewer needs about an address', () => {
    expect(columnIds(RECIPIENT_COLUMNS)).toEqual([
      'email',
      'name',
      'company',
      'label',
      'verification',
      'sources',
      'exclusion',
    ]);
  });

  it('shows the contact, company and email type, or a dash when there is none', () => {
    const row = recipientRow();
    const blank = recipientRow({ name: '', company: '', label: '' });

    expect(formatCell(RECIPIENT_COLUMNS, 'name', row)).toBe('Priya Shah');
    expect(formatCell(RECIPIENT_COLUMNS, 'company', row)).toBe('Urban Café');
    expect(formatCell(RECIPIENT_COLUMNS, 'label', row)).toBe('Work');
    expect(formatCell(RECIPIENT_COLUMNS, 'name', blank)).toBe('—');
    expect(formatCell(RECIPIENT_COLUMNS, 'company', blank)).toBe('—');
    expect(formatCell(RECIPIENT_COLUMNS, 'label', blank)).toBe('—');
  });

  it('names every record behind the address and how it got in', () => {
    const shared = recipientRow({
      sources: [
        {
          kind: AudienceRecordKind.Contact,
          id: 'c1',
          name: 'Priya',
          via: AudienceRecordVia.Rules,
        },
        {
          kind: AudienceRecordKind.Company,
          id: 'co1',
          name: 'Urban Café',
          via: AudienceRecordVia.Selected,
        },
      ],
    });

    expect(formatCell(RECIPIENT_COLUMNS, 'sources', shared)).toBe(
      'CONTACT · RULES, COMPANY · SELECTED',
    );
    expect(formatCell(RECIPIENT_COLUMNS, 'sources', recipientRow({ sources: [] }))).toBe('');
  });

  it('marks an address that will be sent to as eligible, and says why one will not', () => {
    expect(statusOf('exclusion', recipientRow())).toBe('ELIGIBLE');
    expect(statusOf('exclusion', recipientRow({ exclusion: undefined }))).toBe('ELIGIBLE');
    expect(
      statusOf('exclusion', recipientRow({ exclusion: AudienceExclusionReason.Unsubscribed })),
    ).toBe('UNSUBSCRIBED');
  });

  it('shows the verification result as a status chip', () => {
    expect(statusOf('verification', recipientRow({ verification: 'RISKY' }))).toBe('RISKY');
  });

  it('leaves a row still loading blank', () => {
    expect(statusOf('verification', undefined)).toBeNull();
    expect(formatCell(RECIPIENT_COLUMNS, 'sources', undefined)).toBe('');
  });
});

describe('RECIPIENT_COLUMNS email', () => {
  it('renders each address as a link that opens the email window', () => {
    expect(RECIPIENT_COLUMNS.find((col) => col.field === 'email')?.cellRenderer).toBeTypeOf('function');
  });
});
