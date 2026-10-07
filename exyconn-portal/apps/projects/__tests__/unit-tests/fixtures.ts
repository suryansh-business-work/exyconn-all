import {
  BugSeverity,
  BugStatus,
  MilestoneState,
  ProjectRisk,
  ProjectStatus,
  ProjectTimeline,
  SprintState,
  TaskPriority,
  TaskType,
  type DocPageFieldsFragment,
  type DocPageQuery,
  type ListBugsPagedQuery,
  type ListProjectsPagedQuery,
  type MilestoneFieldsFragment,
  type SprintFieldsFragment,
  type TaskFieldsFragment,
} from '@exyconn/shell/graphql/generated';
import type { TableStatsShape } from '@exyconn/shell/components/data/tableStats';
import type { PortfolioRow } from '../../src/pages/overview/portfolio';

export type BugRowFixture = ListBugsPagedQuery['listBugsPaged']['rows'][number];
export type ProjectRowFixture = ListProjectsPagedQuery['listProjectsPaged']['rows'][number];

/**
 * A `listXxxStats` result: `counts` is field -> value -> count, the same shape the server's
 * one aggregation answers with.
 */
export function tableStats(
  total: number,
  counts: Record<string, Record<string, number>> = {},
): TableStatsShape {
  return {
    total,
    counts: Object.entries(counts).map(([field, buckets]) => ({
      field,
      buckets: Object.entries(buckets).map(([value, count]) => ({ value, count })),
    })),
    sums: [],
  };
}

/** A query result that has not answered yet. */
export function pending() {
  return { data: undefined, loading: true, refetch: () => Promise.resolve({}) };
}

export function taskRow(overrides: Partial<TaskFieldsFragment> = {}): TaskFieldsFragment {
  return {
    __typename: 'Task',
    id: 'task-1',
    columnId: 'todo',
    key: 'EXY-1',
    title: 'Login fails',
    description: null,
    type: TaskType.Bug,
    priority: TaskPriority.High,
    assigneeId: '',
    assigneeName: '',
    reporterName: 'Asha Rao',
    labels: [],
    storyPoints: null,
    dueDate: null,
    sprintId: null,
    milestoneId: null,
    parentTaskId: null,
    attachments: [],
    order: 0,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    ...overrides,
  };
}

export function docPage(
  id: string,
  parentId: string | null,
  title: string,
  overrides: Partial<DocPageFieldsFragment> = {},
): DocPageFieldsFragment {
  return {
    __typename: 'DocPage',
    id,
    projectId: 'proj-1',
    parentId,
    title,
    order: 0,
    updatedByName: 'Asha Rao',
    updatedAt: '2026-09-04T10:00:00.000Z',
    ...overrides,
  };
}

/** A page with its body, as the editor loads it. */
export function docPageWithBody(overrides: Partial<DocPageQuery['docPage']> = {}) {
  return { ...docPage('page-1', null, 'Runbook'), body: '<p>Steps</p>', ...overrides };
}

export function sprintRow(overrides: Partial<SprintFieldsFragment> = {}): SprintFieldsFragment {
  return {
    __typename: 'Sprint',
    id: 'sprint-1',
    projectId: 'proj-1',
    name: 'Sprint 12',
    goal: 'Ship sign-in',
    startsOn: '2026-10-01T00:00:00.000Z',
    endsOn: '2026-10-14T00:00:00.000Z',
    state: SprintState.Planned,
    ...overrides,
  };
}

export function milestoneRow(
  overrides: Partial<MilestoneFieldsFragment> = {},
): MilestoneFieldsFragment {
  return {
    __typename: 'Milestone',
    id: 'milestone-1',
    projectId: 'proj-1',
    name: 'Go live',
    description: 'Public launch',
    dueOn: '2026-11-01T00:00:00.000Z',
    state: MilestoneState.InProgress,
    ...overrides,
  };
}

export function bugRow(overrides: Partial<BugRowFixture> = {}): BugRowFixture {
  return {
    __typename: 'Bug',
    id: 'bug-1',
    title: 'Crash on save',
    description: 'The app closes when saving',
    severity: BugSeverity.High,
    status: BugStatus.Open,
    projectId: 'proj-1',
    projectName: 'Website',
    assigneeId: 'emp-1',
    assigneeName: 'Priya',
    taskId: null,
    taskKey: '',
    dueDate: '2026-10-20T00:00:00.000Z',
    ...overrides,
  };
}

export function projectRow(overrides: Partial<ProjectRowFixture> = {}): ProjectRowFixture {
  return {
    __typename: 'Project',
    id: 'proj-1',
    name: 'Website',
    key: 'WEB',
    description: 'Marketing site',
    status: ProjectStatus.Active,
    startDate: '2026-09-01T00:00:00.000Z',
    endDate: '2026-12-01T00:00:00.000Z',
    clientId: 'client-1',
    clientName: 'Northwind',
    budgetAmount: 50000,
    budgetHours: 400,
    ...overrides,
  };
}

export function portfolioRow(overrides: Partial<PortfolioRow> = {}): PortfolioRow {
  return {
    __typename: 'ProjectHealth',
    id: 'p1',
    projectId: 'p1',
    name: 'Website Redesign',
    key: 'WEB',
    status: ProjectStatus.Active,
    clientName: 'Northwind',
    taskCount: 10,
    doneTaskCount: 4,
    progressPercent: 40,
    openBugCount: 3,
    budgetHours: 100,
    loggedHours: 130,
    budgetUsedPercent: 130,
    startDate: '2026-06-01T00:00:00.000Z',
    endDate: '2026-06-30T00:00:00.000Z',
    timeline: ProjectTimeline.Overdue,
    teamSize: 4,
    risk: ProjectRisk.High,
    riskReasons: ['Past its end date'],
    ...overrides,
  };
}
