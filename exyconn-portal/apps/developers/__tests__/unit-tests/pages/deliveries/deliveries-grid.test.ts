import { describe, expect, it } from 'vitest';
import type { ColDef } from 'ag-grid-community';
import {
  DELIVERY_COLUMNS,
  type DeliveryRow,
} from '../../../../src/pages/deliveries/deliveries-grid';
import { delivery } from './delivery.fixtures';

type Formatter = (params: { data?: DeliveryRow; context: unknown }) => string;

const column = (id: string): ColDef<DeliveryRow> => {
  const found = DELIVERY_COLUMNS.find((col) => col.field === id || col.colId === id);
  if (!found) throw new Error(`No column ${id}`);
  return found;
};

const cell = (id: string, row: DeliveryRow) =>
  (column(id).valueFormatter as Formatter)({ data: row, context: { t: (text: string) => text } });

describe('DELIVERY_COLUMNS', () => {
  it('lays out when, where, what, the outcome and the view action', () => {
    expect(DELIVERY_COLUMNS.map((col) => col.field ?? col.colId)).toEqual([
      'createdAt',
      'webhookId',
      'event',
      'status',
      'attempts',
      'responseStatus',
      'error',
      'deliveredAt',
      'actions',
    ]);
  });

  it('names the endpoint, falling back to its id when the endpoint is gone', () => {
    expect(cell('webhookId', delivery())).toBe('CRM bridge');
    expect(cell('webhookId', delivery({ webhookName: '' }))).toBe('hook-1');
  });

  it('writes the attempts and the response code, blank when nothing answered', () => {
    expect(cell('attempts', delivery())).toBe('2');
    expect(cell('responseStatus', delivery())).toBe('502');
    expect(cell('responseStatus', delivery({ responseStatus: null }))).toBe('');
  });

  it('offers one action: viewing the payload and response', () => {
    const { actionSpecs } = column('actions').cellRendererParams as {
      actionSpecs: { key: string; label: string }[];
    };
    expect(actionSpecs.map((spec) => spec.key)).toEqual(['view']);
    expect(actionSpecs[0].label).toBe('see the payload and the response');
  });
});
