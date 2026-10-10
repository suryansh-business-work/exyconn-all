import { techService } from '../../../../src/modules/tech/tech.service';
import { InboundMailConfigModel } from '../../../../src/modules/tech/inbound-mail-config.model';
import { inboundMailbox } from '../../../../src/utils/inboundMail';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';
import { UNKNOWN_ID, credential, inboundInput } from './tech.fixtures';

/**
 * The support mailbox is the one Tech config each company keeps for itself, and its password
 * is the one secret whose blank means "keep" by a different rule (`!password`, not trimmed).
 */
describe('the support mailbox config', () => {
  useTestOrganization();

  it('refuses a mailbox with no password, and stores nothing', async () => {
    expect(await codeOf(techService.createInboundMailConfig(inboundInput({ password: '' })))).toBe(
      'BAD_USER_INPUT',
    );
    expect(await InboundMailConfigModel.countDocuments()).toBe(0);
  });

  it('leaves the active mailbox alone when an inactive one is added', async () => {
    await techService.createInboundMailConfig(inboundInput({ label: 'Main', isActive: true }));
    await techService.createInboundMailConfig(inboundInput({ label: 'Spare' }));

    const active = await InboundMailConfigModel.find({ isActive: true }).lean();
    expect(active.map((row) => row.label)).toEqual(['Main']);
  });

  it('lists the newest mailbox first', async () => {
    const older = await techService.createInboundMailConfig(inboundInput({ label: 'Older' }));
    const newer = await techService.createInboundMailConfig(inboundInput({ label: 'Newer' }));
    await InboundMailConfigModel.collection.updateOne(
      { _id: older._id },
      { $set: { createdAt: new Date('2025-01-01T00:00:00Z') } },
    );
    await InboundMailConfigModel.collection.updateOne(
      { _id: newer._id },
      { $set: { createdAt: new Date('2026-01-01T00:00:00Z') } },
    );

    const listed = await techService.listInboundMailConfigs();

    expect(listed.map((row) => row.label)).toEqual(['Newer', 'Older']);
  });

  it('stores a new password when an edit sends one', async () => {
    const config = await techService.createInboundMailConfig(inboundInput());
    const rotated = credential('rotated-imap');

    await techService.updateInboundMailConfig(
      config._id.toHexString(),
      inboundInput({ password: rotated }),
    );

    const saved = await InboundMailConfigModel.findById(config._id).lean();
    expect(saved?.password).toBe(rotated);
  });

  it('deactivates the other mailboxes, not itself, when an edit makes one active', async () => {
    await techService.createInboundMailConfig(inboundInput({ label: 'Old', isActive: true }));
    const next = await techService.createInboundMailConfig(inboundInput({ label: 'New' }));

    const updated = await techService.updateInboundMailConfig(
      next._id.toHexString(),
      inboundInput({ label: 'New', isActive: true }),
    );

    expect(updated).toMatchObject({ label: 'New', isActive: true });
    const active = await InboundMailConfigModel.find({ isActive: true }).lean();
    expect(active.map((row) => row.label)).toEqual(['New']);
  });

  it('answers NOT_FOUND for an edit of a mailbox that is not there', async () => {
    await expect(techService.updateInboundMailConfig(UNKNOWN_ID, inboundInput())).rejects.toThrow(
      'Inbound mail config not found',
    );
  });

  it('deletes a mailbox, and answers NOT_FOUND the second time', async () => {
    const config = await techService.createInboundMailConfig(inboundInput());

    await expect(techService.deleteInboundMailConfig(config._id.toHexString())).resolves.toBe(true);
    expect(await codeOf(techService.deleteInboundMailConfig(config._id.toHexString()))).toBe(
      'NOT_FOUND',
    );
  });

  it('signs in through the chosen mailbox to check it', async () => {
    const verify = jest.spyOn(inboundMailbox, 'verify').mockResolvedValue();
    const config = await techService.createInboundMailConfig(inboundInput({ label: 'Desk' }));

    await expect(techService.testInboundMailConnection(config._id.toHexString())).resolves.toBe(
      true,
    );

    expect(verify).toHaveBeenCalledTimes(1);
    expect(verify.mock.calls[0][0]).toMatchObject({ label: 'Desk', host: 'imap.example.com' });
  });

  it('passes a sign-in failure straight back to the screen', async () => {
    jest.spyOn(inboundMailbox, 'verify').mockRejectedValue(new Error('Invalid credentials'));
    const config = await techService.createInboundMailConfig(inboundInput());

    await expect(techService.testInboundMailConnection(config._id.toHexString())).rejects.toThrow(
      'Invalid credentials',
    );
  });

  it('checks no mailbox that is not there', async () => {
    const verify = jest.spyOn(inboundMailbox, 'verify').mockResolvedValue();

    expect(await codeOf(techService.testInboundMailConnection(UNKNOWN_ID))).toBe('NOT_FOUND');
    expect(verify).not.toHaveBeenCalled();
  });
});
