import {
  ProjectRisk,
  ProjectStatus,
  ProjectTimeline,
  type ProjectHealthQuery,
  type ProjectShareFieldsFragment,
  type ProjectTimeLogRowFieldsFragment,
  type ProjectTimeLogSessionsQuery,
  type TaskActivityQuery,
  type TaskCommentsQuery,
} from '@exyconn/shell/graphql/generated';

export type HealthFixture = ProjectHealthQuery['projectHealth'];
export type SessionFixture = ProjectTimeLogSessionsQuery['projectTimeLogSessions'][number];
export type ActivityFixture = TaskActivityQuery['taskActivity'][number];
export type CommentFixture = TaskCommentsQuery['taskComments'][number];

/** One project's health, on track unless a test says otherwise. */
export function healthFixture(overrides: Partial<HealthFixture> = {}): HealthFixture {
  return {
    __typename: 'ProjectHealth',
    projectId: 'proj-1',
    name: 'Website',
    key: 'WEB',
    status: ProjectStatus.Active,
    clientName: 'Northwind',
    taskCount: 10,
    doneTaskCount: 4,
    progressPercent: 40,
    openBugCount: 3,
    budgetHours: 100,
    loggedHours: 50,
    budgetUsedPercent: 50,
    startDate: '2026-09-01T00:00:00.000Z',
    endDate: '2026-12-01T00:00:00.000Z',
    timeline: ProjectTimeline.OnTrack,
    teamSize: 4,
    risk: ProjectRisk.Low,
    riskReasons: [],
    ...overrides,
  };
}

export function shareFixture(
  overrides: Partial<ProjectShareFieldsFragment> = {},
): ProjectShareFieldsFragment {
  return {
    __typename: 'ProjectShare',
    id: 'share-1',
    projectId: 'proj-1',
    label: 'Client review',
    expiresAt: '2026-11-01T00:00:00.000Z',
    createdByName: 'Asha Rao',
    revokedAt: null,
    isLive: true,
    createdAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  };
}

export function timeLogRow(
  overrides: Partial<ProjectTimeLogRowFieldsFragment> = {},
): ProjectTimeLogRowFieldsFragment {
  return {
    __typename: 'ProjectTimeLogRow',
    id: 'row-1',
    userId: 'user-1',
    userName: 'Priya',
    taskId: 'task-1',
    taskKey: 'WEB-1',
    taskTitle: 'Landing page',
    activeMs: 5_400_000,
    idleMs: 600_000,
    manualMs: 0,
    sessions: 2,
    screenshots: 6,
    ...overrides,
  };
}

export function sessionFixture(overrides: Partial<SessionFixture> = {}): SessionFixture {
  return {
    __typename: 'ProjectTimeLogSession',
    id: 'run-1',
    userId: 'user-1',
    userName: 'Priya',
    taskKey: 'WEB-1',
    taskTitle: 'Landing page',
    startedAt: '2026-10-02T09:00:00.000Z',
    endedAt: '2026-10-02T10:00:00.000Z',
    activeMs: 3_600_000,
    idleMs: 0,
    screenshotCount: 0,
    ...overrides,
  };
}

export function activityFixture(overrides: Partial<ActivityFixture> = {}): ActivityFixture {
  return {
    __typename: 'TaskActivity',
    id: 'act-1',
    actorName: 'Asha Rao',
    field: 'priority',
    fromValue: 'High',
    toValue: 'Highest',
    createdAt: '2026-10-02T09:00:00.000Z',
    ...overrides,
  };
}

export function commentFixture(overrides: Partial<CommentFixture> = {}): CommentFixture {
  return {
    __typename: 'TaskComment',
    id: 'comment-1',
    authorId: 'emp-1',
    authorName: 'Asha Rao',
    body: 'Looks good',
    createdAt: '2026-10-02T09:00:00.000Z',
    attachments: [],
    ...overrides,
  };
}
