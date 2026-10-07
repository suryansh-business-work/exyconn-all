import {
  GoalStatus,
  LeaveStatus,
  RequestStatus,
  RequestType,
  ReviewStatus,
} from '@exyconn/shell/graphql/generated';
import type {
  DirectReport,
  TeamGoalRow,
  TeamLeaveRow,
  TeamRequestRow,
  TeamReviewRow,
} from '../../../../../src/pages/employee/team/team.types';

/** Ids the team tables resolve to names; anything else falls back to the raw id. */
export const NAMES: Record<string, string> = { 'emp-1': 'Asha Rao', 'emp-2': 'Vikram Shah' };
export const nameOf = (id: string) => NAMES[id] ?? id;

export const report = (patch: Partial<DirectReport> = {}): DirectReport => ({
  id: 'emp-1',
  name: 'Asha Rao',
  email: 'asha@example.com',
  designation: 'Engineer',
  ...patch,
});

export const leaveRow = (patch: Partial<TeamLeaveRow> = {}): TeamLeaveRow => ({
  id: 'leave-1',
  employeeId: 'emp-1',
  type: 'CL',
  fromDate: '2026-03-04T12:00:00.000Z',
  toDate: '2026-03-06T12:00:00.000Z',
  reason: 'Family function',
  status: LeaveStatus.Pending,
  createdAt: '2026-03-01T12:00:00.000Z',
  ...patch,
});

export const requestRow = (patch: Partial<TeamRequestRow> = {}): TeamRequestRow => ({
  id: 'req-1',
  employeeId: 'emp-1',
  type: RequestType.Wfh,
  subject: 'Work from home Friday',
  details: 'Plumber visiting',
  status: RequestStatus.Pending,
  decisionNote: null,
  createdAt: '2026-03-02T12:00:00.000Z',
  ...patch,
});

export const reviewRow = (patch: Partial<TeamReviewRow> = {}): TeamReviewRow => ({
  id: 'review-1',
  employeeId: 'emp-1',
  cycle: '2026 H1',
  selfAssessment: 'Shipped billing.',
  managerAssessment: '',
  score: null,
  status: ReviewStatus.SelfSubmitted,
  updatedAt: '2026-06-30T00:00:00.000Z',
  ...patch,
});

export const goalRow = (patch: Partial<TeamGoalRow> = {}): TeamGoalRow => ({
  id: 'goal-1',
  employeeId: 'emp-1',
  title: 'Ship v2',
  kpi: 'Release date',
  weightage: 40,
  endDate: '2026-06-30T12:00:00.000Z',
  progress: 40,
  status: GoalStatus.Active,
  managerComment: null,
  ...patch,
});
