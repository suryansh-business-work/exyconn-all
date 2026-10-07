import { describe, expect, it } from 'vitest';
import { ManagementStandard } from '@exyconn/shell/graphql/generated';
import { RISK_COLUMNS } from '../../../../src/pages/risks/risks-grid';
import { riskRow } from '../compliance.fixtures';
import { formatCell, getCell, headersOf } from '../grid.helpers';

describe('RISK_COLUMNS', () => {
  it('reads as the register does, ending on the review date and the row actions', () => {
    expect(headersOf(RISK_COLUMNS)).toEqual([
      'Ref',
      'Risk',
      'Category',
      'Owner',
      'Standards',
      'Inherent',
      'Treatment',
      'Residual',
      'Status',
      'Review due',
      '',
    ]);
  });

  it('names the standards as people write them', () => {
    const row = riskRow({ standards: [ManagementStandard.Iso_27001, ManagementStandard.Iso_9001] });
    expect(formatCell(RISK_COLUMNS, 'standards', row)).toBe('ISO 27001, ISO 9001');
    expect(formatCell(RISK_COLUMNS, 'standards', riskRow({ standards: [] }))).toBe('');
  });

  it('shows both ratings with their band, side by side', () => {
    expect(getCell(RISK_COLUMNS, 'inherent', riskRow())).toBe('CRITICAL (20)');
    expect(getCell(RISK_COLUMNS, 'residual', riskRow())).toBe('LOW (3)');
  });

  it('leaves the derived cells empty while a row is still loading', () => {
    expect(formatCell(RISK_COLUMNS, 'standards', undefined)).toBe('');
    expect(getCell(RISK_COLUMNS, 'inherent', undefined)).toBeNull();
    expect(getCell(RISK_COLUMNS, 'residual', undefined)).toBeNull();
  });

  it('formats the review date, or a dash when none is set', () => {
    const due = '2026-12-01T00:00:00.000Z';
    expect(formatCell(RISK_COLUMNS, 'reviewDueOn', riskRow(), due)).toBe(`on ${due}`);
    expect(formatCell(RISK_COLUMNS, 'reviewDueOn', riskRow(), null)).toBe('—');
  });
});
