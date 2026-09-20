import { expireLapsedContracts } from '../../src/modules/legal/legal.expiry';
import { ContractModel } from '../../src/modules/legal/legal.model';
import { sweepReminders } from '../../src/modules/reminders';
import { NotificationModel } from '../../src/modules/notifications/notification.model';
import { UserModel } from '../../src/modules/admin/user.model';
import { ROLES } from '../../src/constants/roles';
import { useTestOrganization } from '../helpers';

import '../../src/modules/legal/legal.reminders';

const DAY = 86_400_000;
const NOW = new Date('2026-09-20T09:00:00.000Z');

const contract = (title: string, expiresInDays: number, status = 'ACTIVE') =>
  ContractModel.create({
    title,
    party: 'Nimbus Ltd',
    type: 'MSA',
    effectiveDate: new Date(NOW.getTime() - 400 * DAY),
    expiryDate: new Date(NOW.getTime() + expiresInDays * DAY),
    status,
  });

/**
 * EXPIRED was in the status list from the beginning and nothing ever wrote it, so an
 * agreement that ran out last March still read as ACTIVE — which is how a business ends up
 * relying on cover it no longer has.
 */
describe('a contract that has run out', () => {
  useTestOrganization();

  it('is marked expired, once its date has passed', async () => {
    await contract('Lapsed', -1);
    await contract('Still running', 30);

    expect(await expireLapsedContracts(NOW)).toBe(1);

    const lapsed = await ContractModel.findOne({ title: 'Lapsed' }).lean();
    const running = await ContractModel.findOne({ title: 'Still running' }).lean();
    expect(lapsed?.status).toBe('EXPIRED');
    expect(running?.status).toBe('ACTIVE');
  });

  it('leaves a draft and a terminated contract alone', async () => {
    await contract('Never signed', -10, 'DRAFT');
    await contract('Ended early', -10, 'TERMINATED');

    expect(await expireLapsedContracts(NOW)).toBe(0);
  });

  it('is chased while it is recent, and not for ever', async () => {
    await UserModel.create({
      name: 'Dev Shah',
      email: 'dev@exyconn.com',
      passwordHash: 'x',
      roles: [ROLES.LEGAL],
      isActive: true,
    });
    await contract('Lapsed last week', -7);
    await contract('Lapsed two years ago', -700);

    await sweepReminders(NOW);
    const titles = (await NotificationModel.find().select('title').lean()).map((row) => row.title);

    expect(titles).toContain('Lapsed last week has expired');
    expect(titles.some((title) => title.includes('two years'))).toBe(false);
  });
});
