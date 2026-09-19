import { ProjectModel } from '../../src/modules/projects/projects.model';
import { BoardColumnModel, TaskModel } from '../../src/modules/projects/board.model';
import { BugModel } from '../../src/modules/bugs/bugs.model';
import { reminderSources } from '../../src/modules/reminders/reminders.registry';
import { sendReminders } from '../../src/modules/reminders';
import { NotificationModel } from '../../src/modules/notifications/notification.model';
import { UserModel } from '../../src/modules/admin/user.model';
import { ROLES } from '../../src/constants/roles';
import { useTestOrganization } from '../helpers';
import type { Reminder } from '../../src/modules/reminders';

// Importing the module registers the source; this is the one under test.
import '../../src/modules/projects/projects.reminders';

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const NOW = new Date('2026-06-15T09:00:00.000Z');

/** The registered `projects-due` source, asked the same question the sweep asks it. */
function dueNow(now = NOW): Promise<Reminder[]> {
  const source = reminderSources().find((candidate) => candidate.key === 'projects-due');
  if (!source) throw new Error('the projects-due reminder source is not registered');
  return source.due(now);
}

const project = () =>
  ProjectModel.create({ name: 'Billing', status: 'ACTIVE', startDate: day('2026-06-01') });

const column = (projectId: unknown, name: string, isDone = false) =>
  BoardColumnModel.create({ projectId, name, order: 0, isDone });

interface TaskOver {
  key?: string;
  title?: string;
  assigneeId?: string;
  dueDate?: Date | null;
}

const task = (projectId: unknown, columnId: unknown, over: TaskOver = {}) =>
  TaskModel.create({
    projectId,
    columnId,
    key: 'BILL-1',
    title: 'Invoice PDF is blank',
    dueDate: day('2026-06-10'),
    ...over,
  });

interface BugOver {
  title?: string;
  status?: string;
  assigneeId?: string;
  dueDate?: Date;
}

const bug = (over: BugOver = {}) =>
  BugModel.create({
    title: 'Login loops',
    description: 'It loops.',
    severity: 'HIGH',
    status: 'OPEN',
    dueDate: day('2026-06-12'),
    ...over,
  });

const developer = async (email = 'dev@exyconn.com') => {
  const user = await UserModel.create({
    name: 'Dev',
    email,
    passwordHash: 'x',
    roles: [ROLES.PROJECTS],
    isActive: true,
  });
  return String(user._id);
};

describe('what the projects-due source chases', () => {
  useTestOrganization();

  it('chases the assignee about an overdue ticket, saying how late it is', async () => {
    const dev = await developer();
    const created = await project();
    const todo = await column(created._id, 'To do');
    await task(created._id, todo._id, { assigneeId: dev });

    const [reminder] = await dueNow();

    expect(reminder.employeeIds).toEqual([dev]);
    expect(reminder.kind).toBe('PROJECT');
    expect(reminder.title).toBe('1 thing due');
    expect(reminder.body).toContain('BILL-1 Invoice PDF is blank (5 days ago)');
    expect(reminder.link).toBe('/projects');
  });

  it('counts a ticket due today as due', async () => {
    const dev = await developer();
    const created = await project();
    const todo = await column(created._id, 'To do');
    await task(created._id, todo._id, { assigneeId: dev, dueDate: day('2026-06-15') });

    const [reminder] = await dueNow();

    expect(reminder.body).toContain('(today)');
  });

  it('leaves tomorrow alone', async () => {
    const dev = await developer();
    const created = await project();
    const todo = await column(created._id, 'To do');
    await task(created._id, todo._id, { assigneeId: dev, dueDate: day('2026-06-16') });

    expect(await dueNow()).toEqual([]);
  });

  it('never chases about a ticket already sitting in a done column', async () => {
    const dev = await developer();
    const created = await project();
    const done = await column(created._id, 'Done', true);
    await task(created._id, done._id, { assigneeId: dev });

    expect(await dueNow()).toEqual([]);
  });

  it('ignores a ticket nobody is carrying, and one with no date', async () => {
    const created = await project();
    const todo = await column(created._id, 'To do');
    await task(created._id, todo._id, { key: 'BILL-1' });
    await task(created._id, todo._id, {
      key: 'BILL-2',
      assigneeId: await developer(),
      dueDate: null,
    });

    expect(await dueNow()).toEqual([]);
  });

  it('chases overdue bugs too, and leaves resolved ones alone', async () => {
    const dev = await developer();
    await bug({ assigneeId: dev });
    await bug({ assigneeId: dev, title: 'Fixed already', status: 'RESOLVED' });

    const [reminder] = await dueNow();

    expect(reminder.title).toBe('1 thing due');
    expect(reminder.body).toContain('Login loops');
    expect(reminder.body).not.toContain('Fixed already');
  });
});

describe('how the chase is summarised', () => {
  useTestOrganization();

  it('sends one notice a person, naming the three most overdue and counting the rest', async () => {
    const dev = await developer();
    const created = await project();
    const todo = await column(created._id, 'To do');
    await task(created._id, todo._id, { key: 'BILL-1', dueDate: day('2026-06-01'), assigneeId: dev });
    await task(created._id, todo._id, { key: 'BILL-2', dueDate: day('2026-06-02'), assigneeId: dev });
    await bug({ assigneeId: dev, title: 'Login loops', dueDate: day('2026-06-03') });
    await bug({ assigneeId: dev, title: 'Search is slow', dueDate: day('2026-06-04') });

    const reminders = await dueNow();

    expect(reminders).toHaveLength(1);
    expect(reminders[0].title).toBe('4 things due');
    expect(reminders[0].body).toContain('BILL-1');
    expect(reminders[0].body).toContain('BILL-2');
    expect(reminders[0].body).toContain('Login loops');
    expect(reminders[0].body).toContain('and 1 more');
    expect(reminders[0].body).not.toContain('Search is slow');
  });

  it('writes to each person about their own work only', async () => {
    const dev = await developer('dev@exyconn.com');
    const other = await developer('other@exyconn.com');
    const created = await project();
    const todo = await column(created._id, 'To do');
    await task(created._id, todo._id, { key: 'BILL-1', assigneeId: dev });
    await task(created._id, todo._id, { key: 'BILL-2', assigneeId: other });

    const reminders = await dueNow();
    const bodies = new Map(reminders.map((r) => [r.employeeIds?.[0], r.body]));

    expect(reminders).toHaveLength(2);
    expect(bodies.get(dev)).toContain('BILL-1');
    expect(bodies.get(dev)).not.toContain('BILL-2');
    expect(bodies.get(other)).toContain('BILL-2');
  });

  it('delivers once a day however often the sweep runs', async () => {
    const dev = await developer();
    const created = await project();
    const todo = await column(created._id, 'To do');
    await task(created._id, todo._id, { assigneeId: dev });

    await sendReminders('projects-due', await dueNow());
    await sendReminders('projects-due', await dueNow());

    expect(await NotificationModel.countDocuments({ employeeId: dev })).toBe(1);
  });
});
