import { purgeAgedAuditLog } from '../../src/modules/audit/audit.retention';
import { AuditLogModel } from '../../src/modules/audit/audit.model';
import { AppSettingsModel } from '../../src/modules/admin/settings.model';
import { useTestOrganization } from '../helpers';

const DAY = 86_400_000;

/**
 * Entries are written now and the clock is moved forward instead of back-dating them.
 *
 * Mongoose writes `createdAt` itself and ignores an attempt to set it, which is right — and
 * it means the honest way to test a retention window is to ask what the purge does when it
 * runs later, which is exactly what it takes a `now` for.
 */
async function entry(label: string) {
  return AuditLogModel.create({
    actorId: 'u1',
    actorName: 'Asha Rao',
    actorEmail: 'asha@exyconn.com',
    action: 'UPDATE',
    module: 'Invoice',
    entityId: 'inv-1',
    entityLabel: label,
    summary: 'Changed the amount',
  });
}

/** `days` from now, which is when the purge is asked to run. */
const laterBy = (days: number) => new Date(Date.now() + days * DAY);

const setRetention = (days: number) =>
  AppSettingsModel.updateOne({ key: 'global' }, { auditRetentionDays: days }, { upsert: true });

/**
 * The audit trail had no retention at all: a collection that grows for ever because nobody
 * ever decided it should. It still does unless somebody sets a window, which is the other
 * half of the point — an audit trail is what an incident is reconstructed from.
 */
describe('audit retention', () => {
  useTestOrganization();

  it('keeps everything until somebody sets a window', async () => {
    await entry('INV-0042');

    expect(await purgeAgedAuditLog(laterBy(1000))).toBe(0);
    expect(await AuditLogModel.countDocuments()).toBe(1);
  });

  it('deletes what is past the window', async () => {
    await entry('INV-0042');
    await entry('INV-0043');
    await setRetention(365);

    expect(await purgeAgedAuditLog(laterBy(400))).toBe(2);
    expect(await AuditLogModel.countDocuments()).toBe(0);
  });

  it('keeps what is still inside it', async () => {
    await entry('INV-0042');
    await setRetention(365);

    expect(await purgeAgedAuditLog(laterBy(100))).toBe(0);
    expect(await AuditLogModel.countDocuments()).toBe(1);
  });

  it('reads zero as keep for ever, whatever is on file', async () => {
    await entry('INV-0042');
    await setRetention(0);

    expect(await purgeAgedAuditLog(laterBy(5000))).toBe(0);
    expect(await AuditLogModel.countDocuments()).toBe(1);
  });
});
