import { describe, expect, it } from 'vitest';
import { DealStage } from '@exyconn/shell/graphql/generated';
import { formatMoney } from '@exyconn/shell/utils/money';
import { DEAL_COLUMNS } from '../../../../src/pages/deals/deals-grid';
import { dealRow } from '../../fixtures';
import { actionSpecs, columnIds, formatCell, isActionHidden } from '../../grid-helpers';

describe('DEAL_COLUMNS', () => {
  it('lists the deal register columns, with the actions last', () => {
    expect(columnIds(DEAL_COLUMNS)).toEqual([
      'title',
      'companyName',
      'contactName',
      'stage',
      'value',
      'probability',
      'expectedCloseDate',
      'owner',
      'actions',
    ]);
  });

  it('shows the company and contact names, or a dash when there is none', () => {
    const named = dealRow({ companyName: 'Acme', contactName: 'Asha Rao' });
    const blank = dealRow({ companyName: '', contactName: '' });

    expect(formatCell(DEAL_COLUMNS, 'companyName', named)).toBe('Acme');
    expect(formatCell(DEAL_COLUMNS, 'contactName', named)).toBe('Asha Rao');
    expect(formatCell(DEAL_COLUMNS, 'companyName', blank)).toBe('—');
    expect(formatCell(DEAL_COLUMNS, 'contactName', blank)).toBe('—');
  });

  it('writes the value as money and the probability as a percent', () => {
    const row = dealRow({ value: 98000, probability: 75 });

    expect(formatCell(DEAL_COLUMNS, 'value', row)).toBe(formatMoney(98000));
    expect(formatCell(DEAL_COLUMNS, 'probability', row)).toBe('75%');
  });

  it('formats the expected close date through the viewer settings, or a dash when unset', () => {
    const formatDate = (value: string) => `on ${value.slice(0, 10)}`;
    const row = dealRow();

    expect(
      formatCell(DEAL_COLUMNS, 'expectedCloseDate', row, {
        value: '2026-11-30T00:00:00.000Z',
        context: { formatDate },
      }),
    ).toBe('on 2026-11-30');
    expect(
      formatCell(DEAL_COLUMNS, 'expectedCloseDate', row, { value: null, context: { formatDate } }),
    ).toBe('—');
  });

  it('offers create invoice, edit and delete, in that order', () => {
    expect(actionSpecs(DEAL_COLUMNS).map((spec) => spec.key)).toEqual([
      'createInvoice',
      'edit',
      'delete',
    ]);
  });

  it('offers an invoice only for a won deal that has a client', () => {
    const won = dealRow({ stage: DealStage.Won, clientId: 'client-1' });
    const wonWithoutClient = dealRow({ stage: DealStage.Won, clientId: '' });
    const open = dealRow({ stage: DealStage.Negotiation, clientId: 'client-1' });

    expect(isActionHidden(DEAL_COLUMNS, 'createInvoice', won)).toBe(false);
    expect(isActionHidden(DEAL_COLUMNS, 'createInvoice', wonWithoutClient)).toBe(true);
    expect(isActionHidden(DEAL_COLUMNS, 'createInvoice', open)).toBe(true);
  });

  it('keeps edit and delete on every row', () => {
    expect(isActionHidden(DEAL_COLUMNS, 'edit', dealRow())).toBe(false);
    expect(isActionHidden(DEAL_COLUMNS, 'delete', dealRow())).toBe(false);
  });
});
