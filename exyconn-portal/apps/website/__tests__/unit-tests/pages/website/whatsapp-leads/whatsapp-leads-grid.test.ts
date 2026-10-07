import { describe, expect, it } from 'vitest';
import type { ColDef, ValueFormatterParams } from 'ag-grid-community';
import type { RowActionSpec } from '@exyconn/crud';
import { WhatsappDemoVisitorSource } from '@exyconn/shell/graphql/generated';
import {
  WHATSAPP_LEAD_COLUMNS,
  type WhatsappLeadRow,
} from '../../../../../src/pages/website/whatsapp-leads/whatsapp-leads-grid';
import { leadRow } from './fixtures';

/** What the grid puts on ag-grid's context: a translator that marks what it translated. */
const context = {
  t: (source: string) => `«${source}»`,
  formatDate: (iso: string) => `date ${iso}`,
};

function column(key: string): ColDef<WhatsappLeadRow> {
  const found = WHATSAPP_LEAD_COLUMNS.find((col) => col.field === key || col.colId === key);
  if (!found) {
    throw new Error(`No column for ${key}`);
  }
  return found;
}

function format(key: string, data?: WhatsappLeadRow): string {
  const formatter = column(key).valueFormatter;
  if (typeof formatter !== 'function') {
    throw new TypeError(`Column ${key} has no formatter`);
  }
  const value = data?.[key as keyof WhatsappLeadRow];
  return formatter({ data, context, value } as ValueFormatterParams<WhatsappLeadRow>);
}

function actionSpecs(): RowActionSpec[] {
  return (column('actions').cellRendererParams as { actionSpecs: RowActionSpec[] }).actionSpecs;
}

describe('WHATSAPP_LEAD_COLUMNS', () => {
  it('lists who signed up, how they came and how often they returned', () => {
    expect(WHATSAPP_LEAD_COLUMNS.map((col) => col.field ?? col.colId)).toEqual([
      'name',
      'email',
      'company',
      'phone',
      'sourceLabel',
      'verifiedAt',
      'signInCount',
      'lastSignInAt',
      'blocked',
      'createdAt',
      'actions',
    ]);
    expect(column('blocked').cellRenderer).toEqual(expect.any(Function));
  });

  it('keeps the searchable contact columns filterable and the rest display-only', () => {
    for (const key of ['name', 'email', 'company', 'phone']) {
      expect(column(key).filter).toBeUndefined();
    }
    for (const key of ['sourceLabel', 'verifiedAt', 'signInCount', 'blocked']) {
      expect(column(key).filter).toBe(false);
    }
    expect(column('sourceLabel').sortable).toBe(false);
  });

  it('names where the lead first asked for a code, in the viewer’s language', () => {
    expect(format('sourceLabel', leadRow())).toBe('«Website»');
    expect(format('sourceLabel', leadRow({ source: WhatsappDemoVisitorSource.DemoLogin }))).toBe(
      '«Demo sign-in»',
    );
    expect(format('sourceLabel')).toBe('');
  });

  it('counts the sign-ins, blank while the row loads', () => {
    expect(format('signInCount', leadRow({ signInCount: 0 }))).toBe('0');
    expect(format('signInCount', leadRow({ signInCount: 12 }))).toBe('12');
    expect(format('signInCount')).toBe('');
  });

  it('dates the milestones, with words for the ones not reached yet', () => {
    const row = leadRow();
    expect(format('verifiedAt', row)).toBe(`date ${row.verifiedAt ?? ''}`);
    expect(format('verifiedAt', leadRow({ verifiedAt: null }))).toBe('«Not yet»');
    expect(format('lastSignInAt', leadRow({ lastSignInAt: null }))).toBe('«—»');
    expect(format('createdAt', row)).toBe(`date ${row.createdAt}`);
  });

  it('offers block for an active lead and allow for a blocked one, then delete', () => {
    const specs = actionSpecs();
    expect(specs.map((spec) => spec.key)).toEqual(['block', 'unblock', 'delete']);
    const [block, unblock] = specs.map((spec) => spec.hidden as (row: WhatsappLeadRow) => boolean);
    expect(block(leadRow())).toBe(false);
    expect(block(leadRow({ blocked: true }))).toBe(true);
    expect(unblock(leadRow())).toBe(true);
    expect(unblock(leadRow({ blocked: true }))).toBe(false);
    expect(specs[0]).toMatchObject({ label: 'block demo access', color: 'warning' });
    expect(specs[1]).toMatchObject({ label: 'allow demo access again', color: 'success' });
  });
});
