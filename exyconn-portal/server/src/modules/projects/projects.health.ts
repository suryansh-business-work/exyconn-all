import { Types } from 'mongoose';
import { ProjectModel } from './projects.model';
import { BoardColumnModel, TaskModel } from './board.model';
import { BugModel } from '../bugs/bugs.model';
import { trackerBillingService } from '../tracker/tracker.billing.service';

/** Percentage points progress may lag elapsed time before the project is called behind. */
const BEHIND_TOLERANCE = 20;

/** How close to the end date counts as due soon. */
const DUE_SOON_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Bugs that still cost somebody something. Resolved and closed ones do not. */
const OPEN_BUG_STATUSES = ['OPEN', 'IN_PROGRESS'];

export type ProjectTimeline = 'NO_DATES' | 'ON_TRACK' | 'DUE_SOON' | 'OVERDUE' | 'COMPLETED';
export type ProjectRisk = 'UNKNOWN' | 'LOW' | 'MEDIUM' | 'HIGH';

export interface ProjectHealth {
  projectId: string;
  name: string;
  key: string;
  status: string;
  clientName: string;
  taskCount: number;
  doneTaskCount: number;
  /** Null when no column is marked done — the board has not said what finished means. */
  progressPercent: number | null;
  openBugCount: number;
  budgetHours: number | null;
  loggedHours: number;
  /** Null when no hours budget was agreed. */
  budgetUsedPercent: number | null;
  startDate: Date | null;
  endDate: Date | null;
  timeline: ProjectTimeline;
  teamSize: number;
  risk: ProjectRisk;
  /** Why the risk is what it is. A rating nobody can question is a rating nobody trusts. */
  riskReasons: string[];
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Share of the agreed window that has already gone, or null without both dates. */
function elapsedPercent(start: Date | null, end: Date | null, now: Date): number | null {
  if (!start || !end) return null;
  const span = end.getTime() - start.getTime();
  if (span <= 0) return null;
  const gone = now.getTime() - start.getTime();
  return Math.min(Math.max((gone / span) * 100, 0), 100);
}

/** Where the project stands against its own dates. */
function timelineOf(
  status: string,
  start: Date | null,
  end: Date | null,
  now: Date,
): ProjectTimeline {
  if (status === 'COMPLETED') return 'COMPLETED';
  if (!end) return 'NO_DATES';
  if (now.getTime() > end.getTime()) return 'OVERDUE';
  if (end.getTime() - now.getTime() <= DUE_SOON_DAYS * MS_PER_DAY) return 'DUE_SOON';
  return 'ON_TRACK';
}

interface RiskInput {
  timeline: ProjectTimeline;
  budgetUsedPercent: number | null;
  progressPercent: number | null;
  elapsed: number | null;
}

/**
 * Why a project is worrying, in the words somebody would use in a stand-up.
 *
 * Each reason is a fact the reader can check for themselves against the numbers beside it.
 * A single opaque red dot invites an argument; a red dot that says "past its end date"
 * ends one.
 */
function riskReasonsFor({
  timeline,
  budgetUsedPercent,
  progressPercent,
  elapsed,
}: RiskInput): string[] {
  const reasons: string[] = [];
  if (timeline === 'OVERDUE') {
    reasons.push('Past its end date');
  }
  if (budgetUsedPercent !== null && budgetUsedPercent > 100) {
    reasons.push('Over its agreed hours');
  }
  if (
    progressPercent !== null &&
    elapsed !== null &&
    progressPercent < elapsed - BEHIND_TOLERANCE
  ) {
    reasons.push('Behind where the calendar says it should be');
  }
  return reasons;
}

/** Nothing measurable means UNKNOWN, not LOW — silence is not good news. */
function riskFrom(reasons: string[], measurable: boolean): ProjectRisk {
  if (!measurable) return 'UNKNOWN';
  if (reasons.length >= 2) return 'HIGH';
  if (reasons.length === 1) return 'MEDIUM';
  return 'LOW';
}

/** Ids of the columns this project treats as the end of the line. */
async function doneColumnIds(projectId: Types.ObjectId): Promise<Types.ObjectId[]> {
  const rows = await BoardColumnModel.find({ projectId, isDone: true }).select('_id').lean();
  return rows.map((row) => row._id);
}

/** Hours actually logged against the project, from the same source the time log shows. */
async function loggedHoursFor(projectId: string, start: Date | null): Promise<number> {
  const from = start ?? new Date(0);
  const rows = await trackerBillingService.billingByProject(from, new Date(), projectId);
  return round(rows.reduce((total, row) => total + row.hours, 0));
}

/** A project's document, as `.lean()` returns it, with only the fields health reads. */
interface ProjectLean {
  _id: Types.ObjectId;
  name: string;
  key: string;
  status: string;
  clientName?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  budgetHours?: number | null;
}

/**
 * One project, measured against what it said it would do.
 *
 * Every figure comes from a record somebody already keeps — tickets on the board, bugs in
 * the tracker, hours from the same billing service the time log reads. Nothing here is
 * entered twice, which is the only reason a health page stays true after the first week.
 */
export async function projectHealth(
  project: ProjectLean,
  now = new Date(),
): Promise<ProjectHealth> {
  const projectId = project._id;
  const id = String(projectId);
  const start = project.startDate ?? null;
  const end = project.endDate ?? null;

  const doneIds = await doneColumnIds(projectId);
  const [taskCount, doneTaskCount, openBugCount, assignees, loggedHours] = await Promise.all([
    TaskModel.countDocuments({ projectId }),
    doneIds.length > 0 ? TaskModel.countDocuments({ projectId, columnId: { $in: doneIds } }) : 0,
    BugModel.countDocuments({ projectId: id, status: { $in: OPEN_BUG_STATUSES } }),
    TaskModel.distinct('assigneeId', { projectId, assigneeId: { $ne: '' } }),
    loggedHoursFor(id, start),
  ]);

  // Null, not zero: a board that has never said which column means finished cannot report
  // progress, and 0% would read as "nothing done" rather than "nobody told us".
  const measurableProgress = doneIds.length > 0 && taskCount > 0;
  const progressPercent = measurableProgress ? round((doneTaskCount / taskCount) * 100) : null;

  const budgetHours = project.budgetHours ?? null;
  const budgetUsedPercent =
    budgetHours && budgetHours > 0 ? round((loggedHours / budgetHours) * 100) : null;

  const timeline = timelineOf(project.status, start, end, now);
  const elapsed = elapsedPercent(start, end, now);
  const riskReasons = riskReasonsFor({ timeline, budgetUsedPercent, progressPercent, elapsed });
  const measurable = progressPercent !== null || budgetUsedPercent !== null || Boolean(end);

  return {
    projectId: id,
    name: project.name,
    key: project.key,
    status: project.status,
    clientName: project.clientName ?? '',
    taskCount,
    doneTaskCount,
    progressPercent,
    openBugCount,
    budgetHours,
    loggedHours,
    budgetUsedPercent,
    startDate: start,
    endDate: end,
    timeline,
    teamSize: assignees.length,
    risk: riskFrom(riskReasons, measurable),
    riskReasons,
  };
}

/** Health for every project, worst first — a portfolio is read to find the one in trouble. */
export async function projectHealthOverview(now = new Date()): Promise<ProjectHealth[]> {
  const projects = await ProjectModel.find()
    .select('name key status clientName startDate endDate budgetHours')
    .lean();
  const rows = await Promise.all(projects.map((project) => projectHealth(project, now)));
  const order: Record<ProjectRisk, number> = { HIGH: 0, MEDIUM: 1, UNKNOWN: 2, LOW: 3 };
  // `rows` is built here, so sorting it in place mutates nothing the caller can see.
  rows.sort((a, b) => order[a.risk] - order[b.risk] || a.name.localeCompare(b.name));
  return rows;
}
