import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { TrackerAccessModel, TrackerMessageModel } from '../../../../src/modules/tracker/models';
import { TRACKER_MESSAGE_LIMITS } from '../../../../src/modules/tracker/tracker.constants';
import { trackerMessageService } from '../../../../src/modules/tracker/tracker.message.service';
import { codeOf } from '../codeOf';

async function tracked(name: string) {
  const user = await UserModel.create({
    name,
    email: `${randomUUID()}@exyconn.com`,
    passwordHash: randomUUID(),
  });
  const userId = user._id.toHexString();
  await TrackerAccessModel.create({ userId, grantedBy: 'admin' });
  return userId;
}

const ADMIN = new Types.ObjectId().toHexString();

describe('message bounds', () => {
  it('refuses a chat line longer than the limit', async () => {
    const tooLong = 'x'.repeat(TRACKER_MESSAGE_LIMITS.maxBodyChars + 1);

    await expect(trackerMessageService.send('u1', 'TO_ADMIN', tooLong, 'u1')).rejects.toThrow(
      `A message cannot be longer than ${TRACKER_MESSAGE_LIMITS.maxBodyChars} characters.`,
    );
  });

  it('accepts a line exactly at the limit, measured after trimming', async () => {
    const userId = await tracked('Asha');
    const atLimit = ` ${'y'.repeat(TRACKER_MESSAGE_LIMITS.maxBodyChars)} `;

    const message = await trackerMessageService.send(userId, 'TO_ADMIN', atLimit, userId);

    expect(message.body).toHaveLength(TRACKER_MESSAGE_LIMITS.maxBodyChars);
  });

  it('refuses a notice title longer than a subject line', async () => {
    const title = 't'.repeat(TRACKER_MESSAGE_LIMITS.maxTitleChars + 1);

    await expect(
      codeOf(trackerMessageService.broadcast({ title, body: 'Body.' }, ADMIN)),
    ).resolves.toBe('BAD_USER_INPUT');
  });
});

describe('notices', () => {
  it('reaches only the named employees who still hold a grant', async () => {
    const asha = await tracked('Asha');
    const dev = await tracked('Dev');
    const ravi = await tracked('Ravi');
    await TrackerAccessModel.updateOne({ userId: ravi }, { isActive: false });

    const sent = await trackerMessageService.broadcast(
      { title: '  Fire drill ', body: ' At 3pm. ', userIds: [asha, ravi] },
      ADMIN,
    );

    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({
      userId: asha,
      kind: 'NOTICE',
      direction: 'TO_EMPLOYEE',
      title: 'Fire drill',
      body: 'At 3pm.',
      // The author account does not exist, so nobody's name is put on it.
      authorName: '',
    });
    expect(await TrackerMessageModel.countDocuments({ userId: dev })).toBe(0);
  });

  it('refuses a notice when nobody holds a grant', async () => {
    await expect(
      trackerMessageService.broadcast({ title: 'Hello', body: 'Anyone?' }, ADMIN),
    ).rejects.toThrow('Nobody has tracker access, so there is nobody to notify.');
  });

  it('keeps notices out of the chat thread and reads them on their own', async () => {
    const asha = await tracked('Asha');
    await trackerMessageService.send(asha, 'TO_EMPLOYEE', 'A chat line.', ADMIN);
    await trackerMessageService.broadcast({ title: 'Holiday', body: 'Friday off.' }, ADMIN);

    const chat = await trackerMessageService.thread(asha);
    const notices = await trackerMessageService.thread(asha, 'NOTICE');

    expect(chat.map((message) => message.body)).toEqual(['A chat line.']);
    expect(notices.map((message) => message.title)).toEqual(['Holiday']);
  });
});

describe('the inbox', () => {
  it('lists a conversation whose employee account has since been deleted', async () => {
    const gone = new Types.ObjectId().toHexString();
    await trackerMessageService.send(gone, 'TO_ADMIN', 'Still here?', gone);

    const [thread] = await trackerMessageService.threads();

    expect(thread).toMatchObject({
      userId: gone,
      userName: 'Unknown employee',
      userEmail: '',
      lastMessageBody: 'Still here?',
      unread: 1,
    });
  });

  it('counts only unread lines travelling to the desk', async () => {
    const asha = await tracked('Asha');
    await trackerMessageService.send(asha, 'TO_ADMIN', 'First.', asha);
    await trackerMessageService.send(asha, 'TO_EMPLOYEE', 'Reply.', ADMIN);
    await trackerMessageService.send(asha, 'TO_ADMIN', 'Second.', asha);

    expect(await trackerMessageService.markRead(asha, 'TO_ADMIN')).toBe(2);
    await trackerMessageService.send(asha, 'TO_ADMIN', 'Third.', asha);

    const [thread] = await trackerMessageService.threads();
    expect(thread).toMatchObject({ userName: 'Asha', unread: 1 });
  });
});
