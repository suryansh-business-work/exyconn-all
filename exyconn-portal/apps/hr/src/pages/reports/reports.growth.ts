import {
  ListGoalsPagedDocument,
  ListPerformanceReviewsPagedDocument,
  ListTrainingsPagedDocument,
  ListExitRecordsPagedDocument,
  type ListGoalsPagedQuery,
  type ListPerformanceReviewsPagedQuery,
  type ListTrainingsPagedQuery,
  type ListExitRecordsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { defineReport } from './reports.types';
import { fetchAllPages } from './fetchAll';
import { nameLookup } from './reports.people';

type Named<T> = T & { employeeName: string };

type Goal = Named<ListGoalsPagedQuery['listGoalsPaged']['rows'][number]>;
export const goalsReport = defineReport<Goal>({
  key: 'goals',
  label: 'Goals',
  description: 'Every goal with weightage, progress and status',
  columns: [
    { header: 'Employee', value: (g) => g.employeeName },
    { header: 'Goal', value: (g) => g.title },
    { header: 'KPI', value: (g) => g.kpi },
    { header: 'Weightage %', value: (g) => g.weightage },
    { header: 'Progress %', value: (g) => g.progress },
    { header: 'Status', value: (g) => g.status },
    { header: 'Start', value: (g) => g.startDate },
    { header: 'End', value: (g) => g.endDate },
  ],
  load: async (client) => {
    const [rows, names] = await Promise.all([
      fetchAllPages(client, ListGoalsPagedDocument, (d: ListGoalsPagedQuery) => d.listGoalsPaged),
      nameLookup(client),
    ]);
    return rows.map((r) => ({ ...r, employeeName: names.get(r.employeeId) ?? r.employeeId }));
  },
});

type Review = Named<
  ListPerformanceReviewsPagedQuery['listPerformanceReviewsPaged']['rows'][number]
>;
export const performanceReport = defineReport<Review>({
  key: 'performance',
  label: 'Performance',
  description: 'Appraisal cycles, scores and ratings',
  columns: [
    { header: 'Employee', value: (r) => r.employeeName },
    { header: 'Cycle', value: (r) => r.cycle },
    { header: 'Status', value: (r) => r.status },
    { header: 'Score', value: (r) => r.score },
    { header: 'Rating', value: (r) => r.rating },
    { header: 'Updated', value: (r) => r.updatedAt },
  ],
  load: async (client) => {
    const [rows, names] = await Promise.all([
      fetchAllPages(
        client,
        ListPerformanceReviewsPagedDocument,
        (d: ListPerformanceReviewsPagedQuery) => d.listPerformanceReviewsPaged,
      ),
      nameLookup(client),
    ]);
    return rows.map((r) => ({ ...r, employeeName: names.get(r.employeeId) ?? r.employeeId }));
  },
});

type Training = Named<ListTrainingsPagedQuery['listTrainingsPaged']['rows'][number]>;
export const trainingReport = defineReport<Training>({
  key: 'training',
  label: 'Training',
  description: 'Assigned courses and completion',
  columns: [
    { header: 'Employee', value: (t) => t.employeeName },
    { header: 'Course', value: (t) => t.title },
    { header: 'Category', value: (t) => t.category },
    { header: 'Provider', value: (t) => t.provider },
    { header: 'Status', value: (t) => t.status },
    { header: 'Due', value: (t) => t.dueOn },
    { header: 'Completed', value: (t) => t.completedOn },
  ],
  load: async (client) => {
    const [rows, names] = await Promise.all([
      fetchAllPages(
        client,
        ListTrainingsPagedDocument,
        (d: ListTrainingsPagedQuery) => d.listTrainingsPaged,
      ),
      nameLookup(client),
    ]);
    return rows.map((r) => ({ ...r, employeeName: names.get(r.employeeId) ?? r.employeeId }));
  },
});

type Exit = Named<ListExitRecordsPagedQuery['listExitRecordsPaged']['rows'][number]>;
export const exitsReport = defineReport<Exit>({
  key: 'exits',
  label: 'Exits',
  description: 'Resignations and where each offboarding stands',
  columns: [
    { header: 'Employee', value: (e) => e.employeeName },
    { header: 'Stage', value: (e) => e.stage },
    { header: 'Resigned', value: (e) => e.resignationDate },
    { header: 'Last working day', value: (e) => e.lastWorkingDate },
    { header: 'Notice days', value: (e) => e.noticePeriodDays },
    { header: 'Assets returned', value: (e) => (e.assetsReturned ? 'Yes' : 'No') },
    { header: 'Documents issued', value: (e) => (e.documentsIssued ? 'Yes' : 'No') },
    { header: 'Final settlement', value: (e) => e.finalSettlementAmount },
  ],
  load: async (client) => {
    const [rows, names] = await Promise.all([
      fetchAllPages(
        client,
        ListExitRecordsPagedDocument,
        (d: ListExitRecordsPagedQuery) => d.listExitRecordsPaged,
      ),
      nameLookup(client),
    ]);
    return rows.map((r) => ({ ...r, employeeName: names.get(r.employeeId) ?? r.employeeId }));
  },
});
