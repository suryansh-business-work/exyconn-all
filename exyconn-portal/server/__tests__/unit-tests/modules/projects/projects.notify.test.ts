import {
  notifyAssignment,
  notifyComment,
  notifyTicketDone,
} from '../../../../src/modules/projects/projects.notify';
import { NotificationModel } from '../../../../src/modules/notifications/notification.model';
import { seedMember } from './projects.fixtures';

const PROJECT_ID = 'p1';

/** A lean ticket row, as the board hands one to the notifier. */
const ticket = (fields: { assigneeId?: string | null; reporterId?: string | null }) => ({
  key: 'BILL-7',
  title: 'Invoice PDF is blank',
  projectId: PROJECT_ID,
  ...fields,
});

const noticesFor = (employeeId: string) => NotificationModel.find({ employeeId }).lean();

describe('project notices on rows with missing people', () => {
  it('announces nothing for a ticket whose assignee is null', async () => {
    const { user } = await seedMember();

    await notifyAssignment(ticket({ assigneeId: null }), { id: user.id, name: 'lead' });

    expect(await NotificationModel.countDocuments()).toBe(0);
  });

  it('announces nothing when the assignee has not changed hands', async () => {
    const { user: dev } = await seedMember('dev@exyconn.com');

    await notifyAssignment(ticket({ assigneeId: dev.id }), { id: 'lead', name: 'lead' }, dev.id);

    expect(await noticesFor(dev.id)).toHaveLength(0);
  });

  it('tells nobody about a comment on a ticket nobody holds or raised', async () => {
    await notifyComment(ticket({ assigneeId: null, reporterId: null }), { id: 'a', name: 'Asha' });

    expect(await NotificationModel.countDocuments()).toBe(0);
  });

  it('tells the reporter of an unassigned ticket that somebody finished it', async () => {
    const { user: reporter } = await seedMember('reporter@exyconn.com');

    await notifyTicketDone(ticket({ reporterId: reporter.id }), { id: 'x', name: 'Asha' }, 'Done');

    const [notice] = await noticesFor(reporter.id);
    expect(notice).toMatchObject({
      kind: 'PROJECT',
      title: 'BILL-7 was moved to Done',
      body: 'Asha moved "Invoice PDF is blank" to Done.',
      link: `/projects/${PROJECT_ID}/board`,
    });
  });
});
