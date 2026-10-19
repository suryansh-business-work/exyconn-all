import { ROLES } from '../../../../src/constants/roles';
import { invalidatePermissionCache } from '../../../../src/lib/permissions';
import { AuditLogModel } from '../../../../src/modules/audit/audit.model';
import { ActivityModel } from '../../../../src/modules/crm/activity.model';
import { CompanyModel } from '../../../../src/modules/crm/company.model';
import { ContactModel } from '../../../../src/modules/crm/contact.model';
import {
  CRM_INTEGRATION_MODULE,
  assertRecordEdit,
  auditIntegration,
  isRecordNumber,
  logActivity,
  recordFor,
} from '../../../../src/modules/crm-integrations/crm-integrations.record';
import { RolePermissionModel } from '../../../../src/modules/permissions/permission.model';
import { CONTACT_PHONE, crmUser } from './fixtures';

const MISSING_ID = '64b7f0c2a1b2c3d4e5f60718';
const NOT_ON_RECORD = 'That number is not on this record. Add it to the record first.';

afterEach(() => {
  invalidatePermissionCache();
});

describe('matching a dialled number to a record', () => {
  it('matches a national number saved with spaces and a leading zero', () => {
    expect(isRecordNumber(['098765 43210'], CONTACT_PHONE)).toBe(true);
  });

  it('does not match a different number or one too short to be sure of', () => {
    expect(isRecordNumber(['+14155550100'], CONTACT_PHONE)).toBe(false);
    expect(isRecordNumber(['3210', ''], CONTACT_PHONE)).toBe(false);
  });
});

describe('the record a call or text is for', () => {
  it('finds a contact by its primary number or any listed number', async () => {
    const asha = await ContactModel.create({
      name: 'Asha',
      email: 'asha@acme.com',
      owner: 'A',
      phone: '+14155550199',
      phones: [{ number: '098765 43210', label: 'Mobile' }],
    });

    await expect(recordFor('CONTACT', asha.id, CONTACT_PHONE)).resolves.toEqual({
      id: asha.id,
      name: 'Asha',
    });
    await expect(recordFor('CONTACT', asha.id, '+14155550199')).resolves.toMatchObject({
      name: 'Asha',
    });
  });

  it('reaches a company through the numbers of its people', async () => {
    const acme = await CompanyModel.create({ name: 'Acme', domain: 'acme.com', owner: 'A' });
    await ContactModel.create({
      name: 'Asha',
      email: 'asha@acme.com',
      owner: 'A',
      companyId: acme.id,
      phone: CONTACT_PHONE,
    });

    await expect(recordFor('COMPANY', acme.id, CONTACT_PHONE)).resolves.toEqual({
      id: acme.id,
      name: 'Acme',
    });
  });

  it('refuses a number that is not on the record, even on a record without numbers', async () => {
    const { insertedId } = await ContactModel.collection.insertOne({ email: 'old@acme.com' });
    const id = insertedId.toHexString();

    await expect(recordFor('CONTACT', id, CONTACT_PHONE)).rejects.toThrow(NOT_ON_RECORD);
  });

  it('reads a record saved without a name as unnamed', async () => {
    const { insertedId } = await ContactModel.collection.insertOne({ phone: CONTACT_PHONE });

    await expect(
      recordFor('CONTACT', insertedId.toHexString(), CONTACT_PHONE),
    ).resolves.toMatchObject({ name: '' });
  });

  it('says which kind of record is missing', async () => {
    await expect(recordFor('CONTACT', MISSING_ID, CONTACT_PHONE)).rejects.toThrow(
      'Contact not found',
    );
    await expect(recordFor('COMPANY', MISSING_ID, CONTACT_PHONE)).rejects.toThrow(
      'Company not found',
    );
  });
});

describe('logging and auditing', () => {
  it('logs the call as a done activity on the record', async () => {
    const id = await logActivity({
      object: 'COMPANY',
      record: { id: MISSING_ID, name: 'Acme' },
      type: 'CALL',
      subject: 'Call to Acme',
      notes: 'Through Twilio.',
      owner: 'Asha',
    });

    const row = await ActivityModel.findById(id).lean();
    expect(row).toMatchObject({
      type: 'CALL',
      relatedType: 'COMPANY',
      relatedId: MISSING_ID,
      relatedName: 'Acme',
      done: true,
      owner: 'Asha',
    });
  });

  it('writes one audit line naming the record and never the number', async () => {
    await auditIntegration(crmUser(), { id: 'r1', label: 'Acme' }, 'CREATE', 'Called Acme');

    const row = await AuditLogModel.findOne().lean();
    expect(row).toMatchObject({
      module: CRM_INTEGRATION_MODULE,
      action: 'CREATE',
      entityId: 'r1',
      entityLabel: 'Acme',
      summary: 'Called Acme',
    });
  });

  it('needs EDIT on the record kind being called', async () => {
    await RolePermissionModel.create({ role: ROLES.CRM, module: 'Company', actions: ['VIEW'] });
    const ctx = crmUser();

    await expect(assertRecordEdit(ctx, 'CONTACT')).resolves.toMatchObject({ id: ctx.user?.id });
    await expect(assertRecordEdit(ctx, 'COMPANY')).rejects.toThrow(
      'Your role may not edit Company',
    );
  });
});
