import { describe, expect, it } from 'vitest';
import { PROBLEM_REPORT_COLUMNS } from '../../../../src/pages/problem-reports/problem-reports-grid';
import {
  PROBLEM_CATEGORIES,
  PROBLEM_SEVERITIES,
  PROBLEM_STATUSES,
} from '../../../../src/pages/problem-reports/problem-reports.constants';

describe('PROBLEM_REPORT_COLUMNS', () => {
  it('lists the triage columns with edit and delete last', () => {
    expect(PROBLEM_REPORT_COLUMNS.map((col) => col.field ?? col.colId)).toEqual([
      'reference',
      'subject',
      'serviceName',
      'category',
      'severity',
      'status',
      'reporterName',
      'reporterEmail',
      'assignee',
      'createdAt',
      'actions',
    ]);
    expect(PROBLEM_REPORT_COLUMNS.map((col) => col.headerName)).toEqual([
      'Reference',
      'Problem',
      'Service',
      'Type',
      'Severity',
      'Status',
      'Reported by',
      'Email',
      'Assignee',
      'Received',
      '',
    ]);
  });
});

describe('problem report constants', () => {
  it('mirror the server enums exactly', () => {
    expect(PROBLEM_CATEGORIES).toEqual(['DATA', 'LOGIN', 'OTHER', 'OUTAGE', 'SLOWNESS', 'UI']);
    expect(PROBLEM_SEVERITIES).toEqual(['CRITICAL', 'HIGH', 'LOW', 'MEDIUM']);
    expect(PROBLEM_STATUSES).toEqual(['CLOSED', 'IN_PROGRESS', 'NEW', 'RESOLVED', 'TRIAGED']);
  });
});
