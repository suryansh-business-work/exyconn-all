import { Types } from 'mongoose';
import { UserModel } from '../../src/modules/admin/user.model';
import { TrackerAccessModel, TrackerMessageModel } from '../../src/modules/tracker/models';
import { trackerMessageService } from '../../src/modules/tracker/tracker.message.service';

const ADMIN = new Types.ObjectId().toString();

/** An employee with an active tracker grant — the only kind a notice reaches. */
async function tracked(name: string) {
  const user = await UserModel.create({
    name,
    email: `${name.toLowerCase()}@exyconn.com`,
    passwordHash: 'hashed-in-real-life',
  });
  const userId = String(user._id);
  await TrackerAccessModel.create({ userId, grantedBy: ADMIN, isActive: true });
  return userId;
}

describe('tracker messages', () => {
  beforeEach(async () => {
    await UserModel.create({
      _id: ADMIN,
      name: 'Ops',
      email: 'ops@exyconn.com',
      passwordHash: 'x',
    });
  });

  it('keeps a thread in the order it was said, oldest first', async () => {
    const employee = await tracked('Asha');
    await trackerMessageService.send(employee, 'TO_ADMIN', 'Is my Friday logged?', employee);
    await trackerMessageService.send(employee, 'TO_EMPLOYEE', 'Looking now.', ADMIN);

    const thread = await trackerMessageService.thread(employee);

    expect(thread.map((message) => message.body)).toEqual(['Is my Friday logged?', 'Looking now.']);
  });

  it('stamps the author from the account, never from the caller', async () => {
    const employee = await tracked('Dev');

    const message = await trackerMessageService.send(employee, 'TO_EMPLOYEE', 'Noted.', ADMIN);

    // A client that could name its own author could put anybody's name on a message.
    expect(message.authorName).toBe('Ops');
  });

  it('refuses an empty message rather than storing a blank line', async () => {
    const employee = await tracked('Ravi');

    await expect(trackerMessageService.send(employee, 'TO_ADMIN', '   ', employee)).rejects.toThrow(
      'A message cannot be empty.',
    );
  });

  it('reaches every employee with an active grant when a notice names nobody', async () => {
    const asha = await tracked('Asha');
    const dev = await tracked('Dev');

    const sent = await trackerMessageService.broadcast(
      { title: 'Office closed', body: 'Friday is a holiday.' },
      ADMIN,
    );

    expect(sent).toHaveLength(2);
    expect(sent.map((message) => message.userId).sort()).toEqual([asha, dev].sort());
  });

  it('leaves out a revoked grant, whose announcement nobody would ever open', async () => {
    const asha = await tracked('Asha');
    const dev = await tracked('Dev');
    await TrackerAccessModel.updateOne({ userId: dev }, { isActive: false });

    const sent = await trackerMessageService.broadcast(
      { title: 'Office closed', body: 'Friday is a holiday.' },
      ADMIN,
    );

    expect(sent.map((message) => message.userId)).toEqual([asha]);
  });

  it('refuses a notice with no title, which nothing downstream could render', async () => {
    await tracked('Asha');

    await expect(
      trackerMessageService.broadcast({ title: '  ', body: 'Something.' }, ADMIN),
    ).rejects.toThrow('A notice needs a title.');
  });

  it('hands the desktop app only the announcements it has not raised yet', async () => {
    const employee = await tracked('Asha');
    await trackerMessageService.broadcast({ title: 'First', body: 'One.' }, ADMIN);

    expect(await trackerMessageService.pendingNotices(employee)).toHaveLength(1);
    await trackerMessageService.markRead(employee, 'TO_EMPLOYEE', 'NOTICE');

    // Without this the same notice would be raised on every keep-alive, forever.
    expect(await trackerMessageService.pendingNotices(employee)).toHaveLength(0);
  });

  it('counts chat as unread but never a notice, which the app clears as it raises it', async () => {
    const employee = await tracked('Asha');
    await trackerMessageService.send(employee, 'TO_EMPLOYEE', 'Have a look.', ADMIN);
    await trackerMessageService.broadcast({ title: 'Office closed', body: 'Friday.' }, ADMIN);

    expect(await trackerMessageService.unreadCount(employee, 'TO_EMPLOYEE')).toBe(1);
  });

  it('lets only the recipient clear a message, never its sender', async () => {
    const employee = await tracked('Asha');
    await trackerMessageService.send(employee, 'TO_ADMIN', 'A question.', employee);

    // The employee reading their own thread marks what came TO them; their own outbound
    // line stays unread until somebody at the desk actually reads it.
    await trackerMessageService.markRead(employee, 'TO_EMPLOYEE');

    expect(await trackerMessageService.unreadCount(employee, 'TO_ADMIN')).toBe(1);
  });

  it('lists conversations newest first, with what is waiting on each', async () => {
    const asha = await tracked('Asha');
    const dev = await tracked('Dev');
    await trackerMessageService.send(asha, 'TO_ADMIN', 'Older.', asha);
    await TrackerMessageModel.updateMany({ userId: asha }, { createdAt: new Date(0) });
    await trackerMessageService.send(dev, 'TO_ADMIN', 'Newer.', dev);

    const threads = await trackerMessageService.threads();

    expect(threads.map((thread) => thread.userName)).toEqual(['Dev', 'Asha']);
    expect(threads[0]).toMatchObject({ unread: 1, lastMessageBody: 'Newer.' });
  });
});
