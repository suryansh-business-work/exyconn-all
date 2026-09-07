import { isValidObjectId } from 'mongoose';
import { BugModel } from './bugs.model';
import { UserModel } from '../admin/user.model';
import { BoardColumnModel } from '../projects/board.model';
import { boardService, type Actor } from '../projects/board.service';
import { ProjectModel } from '../projects/projects.model';
import { badRequest } from '../../utils/errors';

/** A bug's severity as the priority its ticket opens with. */
const PRIORITY_OF_SEVERITY: Readonly<Record<string, string>> = {
  CRITICAL: 'HIGHEST',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
};

/** The bug fields whose names are looked up from their ids, never trusted from the form. */
export interface BugNames {
  projectName: string;
  assigneeName: string;
}

/**
 * The project's name for its id. An empty id is allowed — a bug need not be on a project —
 * but an id that matches nothing is a mistake and is refused rather than stored blank.
 */
export async function projectNameFor(projectId: string | null | undefined): Promise<string> {
  if (!projectId) {
    return '';
  }
  const project = isValidObjectId(projectId)
    ? await ProjectModel.findById(projectId).select('name').lean()
    : null;
  if (!project) {
    badRequest('That project does not exist.');
  }
  return project.name;
}

/** The assignee's name for their id. A bug always has an assignee, so the id must resolve. */
export async function assigneeNameFor(assigneeId: string): Promise<string> {
  const user = isValidObjectId(assigneeId)
    ? await UserModel.findById(assigneeId).select('name').lean()
    : null;
  if (!user) {
    badRequest('That assignee does not exist.');
  }
  return user.name;
}

/**
 * Turns a bug into a ticket on its project's board, in the first column, and records the
 * ticket's id and key on the bug so the two stay linked and it cannot be promoted twice.
 *
 * The ticket is made through the board service so it gets a real key (EXY-14), a history
 * line and the same reporter rules as one created on the board.
 */
export async function promoteBugToTask(id: string, actor: Actor) {
  const bug = await BugModel.findById(id);
  if (!bug) {
    badRequest('That bug does not exist.');
  }
  if (bug.taskId) {
    badRequest(`This bug is already ticket ${bug.taskKey}.`);
  }
  if (!bug.projectId) {
    badRequest('Put the bug on a project before promoting it to a ticket.');
  }
  const column = await BoardColumnModel.findOne({ projectId: bug.projectId })
    .sort({ order: 1 })
    .select('_id')
    .lean();
  if (!column) {
    badRequest('The project board has no columns yet. Add one before promoting a bug.');
  }

  const task = await boardService.createTask(
    bug.projectId,
    String(column._id),
    {
      title: bug.title,
      description: bug.description,
      type: 'BUG',
      priority: PRIORITY_OF_SEVERITY[bug.severity],
      assigneeId: bug.assigneeId || null,
      dueDate: bug.dueDate,
    },
    actor,
    bug.assigneeName,
  );
  bug.taskId = String(task._id);
  bug.taskKey = task.key;
  await bug.save();
  return task;
}
