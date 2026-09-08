import type { TaskFieldsFragment } from '@exyconn/shell/graphql/generated';

/** The board's own id for "in the backlog", used by the sprint selector. */
export const BACKLOG = 'backlog';

/** Committed and completed points for one sprint, and how far through it is. */
export interface SprintProgress {
  /** Story points on every ticket in the sprint. Unsized tickets count zero. */
  committedPoints: number;
  /** Story points on the tickets that have reached the done column. */
  completedPoints: number;
  ticketCount: number;
  completedTickets: number;
  /** 0–100. Zero when nothing was committed, so an empty sprint never shows as finished. */
  percentComplete: number;
}

/** An epic and the tickets filed under it, for the board's grouped read. */
export interface EpicGroup {
  epic: TaskFieldsFragment;
  children: TaskFieldsFragment[];
}

const pointsOf = (task: TaskFieldsFragment): number => task.storyPoints ?? 0;

const sum = (tasks: TaskFieldsFragment[]): number =>
  tasks.reduce((total, task) => total + pointsOf(task), 0);

/**
 * The column a board treats as done: the last one.
 *
 * A board's columns are the project's own, so there is no fixed Done column to look up by
 * name. The right-most column is the convention these boards already follow, and it is the
 * same rule the server applies when it decides what carries over from a completed sprint.
 */
export function doneColumnIdOf(columns: ReadonlyArray<{ id: string }>): string | null {
  return columns.length === 0 ? null : columns[columns.length - 1].id;
}

/**
 * Committed against completed for the tickets in one sprint.
 *
 * "Completed" is by column, not by ticket state: the board has no state beyond where a card
 * sits, and counting anything else would report a different number from the one somebody is
 * looking at on the board.
 */
export function sprintProgress(
  tasks: readonly TaskFieldsFragment[],
  sprintId: string,
  doneColumnId: string | null,
): SprintProgress {
  const inSprint = tasks.filter((task) => task.sprintId === sprintId);
  const done =
    doneColumnId === null ? [] : inSprint.filter((task) => task.columnId === doneColumnId);
  const committedPoints = sum(inSprint);
  const completedPoints = sum(done);
  return {
    committedPoints,
    completedPoints,
    ticketCount: inSprint.length,
    completedTickets: done.length,
    percentComplete:
      committedPoints === 0 ? 0 : Math.round((completedPoints / committedPoints) * 100),
  };
}

/** The tickets a sprint selection shows: one sprint's, the backlog's, or all of them. */
export function tasksForSprint(
  tasks: readonly TaskFieldsFragment[],
  selection: string,
): TaskFieldsFragment[] {
  if (selection === '') {
    return [...tasks];
  }
  if (selection === BACKLOG) {
    return tasks.filter((task) => !task.sprintId);
  }
  return tasks.filter((task) => task.sprintId === selection);
}

/**
 * Epics and what is filed under each, plus everything that belongs to no epic.
 *
 * A ticket whose `parentTaskId` points at an epic outside the given list is treated as
 * loose rather than dropped — filtering the board by sprint can leave an epic behind, and a
 * ticket that vanished from every group would be a ticket nobody could find.
 */
export function groupByEpic(tasks: readonly TaskFieldsFragment[]): {
  groups: EpicGroup[];
  loose: TaskFieldsFragment[];
} {
  const epics = tasks.filter((task) => task.type === 'EPIC');
  const epicIds = new Set(epics.map((epic) => epic.id));
  const rest = tasks.filter((task) => task.type !== 'EPIC');

  return {
    groups: epics.map((epic) => ({
      epic,
      children: rest.filter((task) => task.parentTaskId === epic.id),
    })),
    loose: rest.filter((task) => !task.parentTaskId || !epicIds.has(task.parentTaskId)),
  };
}
