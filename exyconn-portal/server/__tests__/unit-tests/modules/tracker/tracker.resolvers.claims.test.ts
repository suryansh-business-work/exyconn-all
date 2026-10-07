import { as, FROM, manual, ME, messages, signInAsTheEmployee, TO, workday } from './resolverMocks';
import { ROLES } from '../../../../src/constants/roles';
import { setPresence } from '../../../../src/modules/tracker/tracker.presence.service';
import { trackerResolvers } from '../../../../src/modules/tracker/tracker.resolvers';

const Mutation = trackerResolvers.Mutation;
const employee = as(ROLES.EMPLOYEE);

beforeEach(() => {
  signInAsTheEmployee();
});

describe('what an employee files for themselves', () => {
  it('books a claim to the resolved project and a ticket on that project', async () => {
    workday.bookableProject.mockResolvedValue({ id: 'p1', name: 'Apollo' });
    workday.bookableTask.mockResolvedValue({ id: 't1', key: 'APO-1', title: 'Build' });
    manual.create.mockResolvedValue({ _id: 'm1' });
    const input = { projectId: 'p1', taskId: 't1', startedAt: FROM, endedAt: TO, note: 'Workshop' };

    const entry = await Mutation.createTrackerManualEntry(null, { input }, employee);

    expect(workday.bookableTask).toHaveBeenCalledWith('p1', 't1');
    expect(manual.create).toHaveBeenCalledWith(
      ME,
      input,
      { id: 'p1', name: 'Apollo' },
      { id: 't1', key: 'APO-1', title: 'Build' },
    );
    expect(entry).toMatchObject({ id: 'm1' });
  });

  it('asks for a ticket on no project when no project resolves', async () => {
    workday.bookableProject.mockResolvedValue(undefined);
    workday.bookableTask.mockResolvedValue(null);
    manual.create.mockResolvedValue({ _id: 'm2' });

    await Mutation.createTrackerManualEntry(
      null,
      { input: { startedAt: FROM, endedAt: TO, note: 'Workshop' } },
      employee,
    );

    expect(workday.bookableTask).toHaveBeenCalledWith('', undefined);
  });

  it('withdraws, writes, reads and sets presence only as the caller', async () => {
    manual.withdraw.mockResolvedValue(true);
    messages.send.mockResolvedValue({ _id: 'c1' });
    messages.markRead.mockResolvedValue(1);
    jest.mocked(setPresence).mockResolvedValue({ status: 'LUNCH', note: '', since: null });

    await expect(Mutation.withdrawTrackerManualEntry(null, { id: 'm1' }, employee)).resolves.toBe(
      true,
    );
    await expect(
      Mutation.sendMyTrackerMessage(null, { body: 'Hi' }, employee),
    ).resolves.toMatchObject({
      id: 'c1',
    });
    await Mutation.markMyTrackerMessagesRead(null, {}, employee);
    await Mutation.markMyTrackerMessagesRead(null, { kind: 'NOTICE' }, employee);
    await Mutation.setMyTrackerPresence(null, { status: 'LUNCH', note: 'canteen' }, employee);

    expect(manual.withdraw).toHaveBeenCalledWith('m1', ME);
    expect(messages.send).toHaveBeenCalledWith(ME, 'TO_ADMIN', 'Hi', ME);
    expect(messages.markRead).toHaveBeenNthCalledWith(1, ME, 'TO_EMPLOYEE', undefined);
    expect(messages.markRead).toHaveBeenNthCalledWith(2, ME, 'TO_EMPLOYEE', 'NOTICE');
    expect(setPresence).toHaveBeenCalledWith(ME, 'LUNCH', 'canteen');
  });
});
