import { describe, expect, it } from 'vitest';
import {
  ListExitRecordsPagedDocument,
  ListGoalsPagedDocument,
  ListPerformanceReviewsPagedDocument,
  ListTrainingsPagedDocument,
  ListUsersDocument,
} from '@exyconn/shell/graphql/generated';
import {
  exitsReport,
  goalsReport,
  performanceReport,
  trainingReport,
} from '../../../../src/pages/reports/reports.growth';
import type { AnyReport } from '../../../../src/pages/reports/reports.types';
import { fakeClient, pageOf, type QueryOptions } from './fake-client';

const goal = {
  employeeId: 'u1',
  title: 'Ship v2',
  kpi: 'Release',
  weightage: 40,
  progress: 75,
  status: 'ACTIVE',
  startDate: '2026-01-01',
  endDate: '2026-06-30',
};
const review = {
  employeeId: 'gone',
  cycle: 'FY26 H1',
  status: 'OPEN',
  score: 8,
  rating: 'Exceeds',
  updatedAt: '2026-03-04',
};
const training = {
  employeeId: 'u1',
  title: 'Security 101',
  category: 'Compliance',
  provider: 'Acme',
  status: 'DONE',
  dueOn: '2026-02-01',
  completedOn: '2026-01-20',
};
const exit = (employeeId: string, done: boolean) => ({
  employeeId,
  stage: 'NOTICE',
  resignationDate: '2026-02-01',
  lastWorkingDate: '2026-03-01',
  noticePeriodDays: 28,
  assetsReturned: done,
  documentsIssued: done,
  finalSettlementAmount: 12000,
});

/** Answers a paged document with one page of `rows`. */
const paged = (field: string, rows: object[]) => (options: QueryOptions) => ({
  [field]: pageOf(rows, options),
});

const { client } = fakeClient([
  [ListUsersDocument, () => ({ listUsers: [{ id: 'u1', name: 'Asha' }] })],
  [ListGoalsPagedDocument, paged('listGoalsPaged', [goal])],
  [ListPerformanceReviewsPagedDocument, paged('listPerformanceReviewsPaged', [review])],
  [ListTrainingsPagedDocument, paged('listTrainingsPaged', [training])],
  [
    ListExitRecordsPagedDocument,
    paged('listExitRecordsPaged', [exit('u1', true), exit('gone', false)]),
  ],
]);

/** A report's rows as its CSV would write them: header -> value. */
async function csvRows(report: AnyReport) {
  const rows = await report.load(client);
  return rows.map((row) =>
    Object.fromEntries(report.columns.map((column) => [column.header, column.value(row)])),
  );
}

describe('growth reports', () => {
  it('lists every goal with weightage, progress and dates, named by employee', async () => {
    expect(goalsReport).toMatchObject({ key: 'goals', label: 'Goals' });
    expect(await csvRows(goalsReport)).toEqual([
      {
        Employee: 'Asha',
        Goal: 'Ship v2',
        KPI: 'Release',
        'Weightage %': 40,
        'Progress %': 75,
        Status: 'ACTIVE',
        Start: '2026-01-01',
        End: '2026-06-30',
      },
    ]);
  });

  it('lists appraisals, keeping the id of somebody no longer listed', async () => {
    expect(await csvRows(performanceReport)).toEqual([
      {
        Employee: 'gone',
        Cycle: 'FY26 H1',
        Status: 'OPEN',
        Score: 8,
        Rating: 'Exceeds',
        Updated: '2026-03-04',
      },
    ]);
  });

  it('lists assigned courses and when each was completed', async () => {
    expect(await csvRows(trainingReport)).toEqual([
      {
        Employee: 'Asha',
        Course: 'Security 101',
        Category: 'Compliance',
        Provider: 'Acme',
        Status: 'DONE',
        Due: '2026-02-01',
        Completed: '2026-01-20',
      },
    ]);
  });

  it('writes each exit checklist flag as Yes or No', async () => {
    const rows = await csvRows(exitsReport);

    expect(rows[0]).toEqual({
      Employee: 'Asha',
      Stage: 'NOTICE',
      Resigned: '2026-02-01',
      'Last working day': '2026-03-01',
      'Notice days': 28,
      'Assets returned': 'Yes',
      'Documents issued': 'Yes',
      'Final settlement': 12000,
    });
    expect(rows[1]).toMatchObject({
      Employee: 'gone',
      'Assets returned': 'No',
      'Documents issued': 'No',
    });
  });
});
