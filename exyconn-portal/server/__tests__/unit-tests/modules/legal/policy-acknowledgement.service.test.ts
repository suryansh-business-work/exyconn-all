import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import { policyAcknowledgementService } from '../../../../src/modules/legal/policy-acknowledgement.service';
import { PolicyModel } from '../../../../src/modules/legal/policy.model';
import { PolicyAcknowledgementModel } from '../../../../src/modules/legal/policy-acknowledgement.model';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { logger } from '../../../../src/utils/logger';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';

jest.mock('../../../../src/modules/email', () => ({
  emailer: { send: jest.fn().mockResolvedValue(undefined) },
}));

import { emailer } from '../../../../src/modules/email';

const mailed = emailer.send as jest.Mock;
const signer = String(new Types.ObjectId());

const policy = (overrides: Record<string, unknown> = {}) =>
  PolicyModel.create({
    title: 'Acceptable Use',
    slug: 'acceptable-use',
    body: '<p>Use it well.</p>',
    status: 'PUBLISHED',
    version: 3,
    effectiveDate: new Date('2026-01-01'),
    ...overrides,
  });

const person = () =>
  UserModel.create({
    name: 'Kiran Das',
    email: 'kiran@exyconn.com',
    passwordHash: randomUUID(),
    roles: ['EMPLOYEE'],
    isActive: true,
  });

/** Lets the fire-and-forget confirmation settle before the test looks at it. */
const settle = () => new Promise((resolve) => setImmediate(resolve));

useTestOrganization();

describe('signing a policy', () => {
  it('records the trimmed name against the published version and emails a copy', async () => {
    const row = await policy();
    const user = await person();

    const record = await policyAcknowledgementService.sign(
      user.id,
      String(row._id),
      '  Kiran Das  ',
    );

    expect(record).toMatchObject({
      policyTitle: 'Acceptable Use',
      version: 3,
      userName: 'Kiran Das',
      userEmail: 'kiran@exyconn.com',
      signedName: 'Kiran Das',
    });
    expect(mailed).toHaveBeenCalledWith(
      expect.objectContaining({
        template: 'policy-acknowledged',
        to: 'kiran@exyconn.com',
        triggeredBy: 'kiran@exyconn.com',
        variables: expect.objectContaining({
          name: 'Kiran Das',
          policyTitle: 'Acceptable Use',
          version: '3',
          signedName: 'Kiran Das',
        }),
      }),
    );
  });

  it('greets a signer whose account has no name by their email', async () => {
    const row = await policy();
    const user = await person();
    // Written straight to the collection: the schema would refuse an empty name.
    await UserModel.collection.updateOne({ _id: user._id }, { $set: { name: '' } });

    const record = await policyAcknowledgementService.sign(user.id, String(row._id), 'K. Das');

    expect(record.userName).toBe('');
    expect(mailed.mock.calls[0][0].variables.name).toBe('kiran@exyconn.com');
  });

  it('still records a signer whose account is gone, and emails nobody', async () => {
    const row = await policy();
    const userId = String(new Types.ObjectId());

    const record = await policyAcknowledgementService.sign(userId, String(row._id), 'Ghost');

    expect(record).toMatchObject({ userId, userName: '', userEmail: '' });
    expect(mailed).not.toHaveBeenCalled();
  });

  it('keeps the signature when the confirmation email fails, and logs why', async () => {
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    mailed.mockRejectedValueOnce(new Error('SMTP down'));
    const row = await policy();
    const user = await person();

    await policyAcknowledgementService.sign(user.id, String(row._id), 'Kiran Das');
    await settle();

    expect(await PolicyAcknowledgementModel.countDocuments()).toBe(1);
    expect(logged).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      'Policy acknowledgement email to kiran@exyconn.com failed',
    );
    logged.mockRestore();
  });

  it('refuses a policy that is missing, drafted or archived', async () => {
    const draft = await policy({ slug: 'draft', status: 'DRAFT' });
    const archived = await policy({ slug: 'archived', status: 'ARCHIVED' });
    const sign = (id: string) =>
      policyAcknowledgementService.sign(String(new Types.ObjectId()), id, 'Kiran Das');

    expect(await codeOf(sign(String(new Types.ObjectId())))).toBe('NOT_FOUND');
    expect(await codeOf(sign(String(draft._id)))).toBe('NOT_FOUND');
    expect(await codeOf(sign(String(archived._id)))).toBe('NOT_FOUND');
  });

  it('refuses a blank name, and a second signature on the same version', async () => {
    const row = await policy();
    const id = String(row._id);

    expect(await codeOf(policyAcknowledgementService.sign(signer, id, '   '))).toBe(
      'BAD_USER_INPUT',
    );
    await policyAcknowledgementService.sign(signer, id, 'Kiran Das');
    await expect(policyAcknowledgementService.sign(signer, id, 'Kiran Das')).rejects.toThrow(
      'You have already signed version 3 of "Acceptable Use".',
    );
  });

  it('asks again once a new version is in force', async () => {
    const row = await policy();
    const id = String(row._id);
    await policyAcknowledgementService.sign(signer, id, 'Kiran Das');
    await PolicyModel.updateOne({ _id: row._id }, { version: 4 });

    const again = await policyAcknowledgementService.sign(signer, id, 'Kiran Das');

    expect(again.version).toBe(4);
    expect(await PolicyAcknowledgementModel.countDocuments({ userId: signer })).toBe(2);
  });
});
