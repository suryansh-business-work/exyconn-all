import { sweepReminders } from '../../src/modules/reminders';
import { NotificationModel } from '../../src/modules/notifications/notification.model';
import { UserModel } from '../../src/modules/admin/user.model';
import { AssetModel } from '../../src/modules/assets/asset.model';
import { LicenceModel } from '../../src/modules/assets/licence.model';
import { ItCloudResourceModel } from '../../src/modules/itsm/models';
import { ProductModel } from '../../src/modules/products/products.model';
import { OnboardingChecklistModel } from '../../src/modules/onboarding/onboarding.model';
import { ROLES, type Role } from '../../src/constants/roles';
import { useTestOrganization } from '../helpers';

// Registering happens on import, the way the server does it.
import '../../src/modules/itsm/itsm.reminders';
import '../../src/modules/products/products.reminders';
import '../../src/modules/hr/hr.reminders';

const DAY = 86_400_000;
const NOW = new Date('2026-09-20T09:00:00.000Z');

async function seed(role: Role, email: string) {
  const user = await UserModel.create({
    name: email.split('@')[0],
    email,
    passwordHash: 'x',
    roles: [role],
    isActive: true,
  });
  return String(user._id);
}

const titlesFor = async (employeeId: string) =>
  (await NotificationModel.find({ employeeId }).select('title').lean()).map((row) => row.title);

describe('the dates IT already set a warning period for', () => {
  useTestOrganization();

  it('chases a warranty, a renewal and a certificate', async () => {
    const it = await seed(ROLES.IT, 'it@exyconn.com');
    await AssetModel.create({
      assetTag: 'LAP-014',
      name: 'MacBook Pro',
      category: 'LAPTOP',
      status: 'ASSIGNED',
      assignedToName: 'Asha Rao',
      warrantyExpiry: new Date(NOW.getTime() + 10 * DAY),
    });
    await LicenceModel.create({
      name: 'Figma',
      vendor: 'Figma Inc',
      seatsTotal: 10,
      assigneeIds: ['u1', 'u2'],
      billingCycle: 'YEARLY',
      cost: 4000,
      currency: 'INR',
      renewalDate: new Date(NOW.getTime() + 5 * DAY),
      status: 'ACTIVE',
    });
    await ItCloudResourceModel.create({
      name: 'exyconn.com certificate',
      kind: 'SSL_CERTIFICATE',
      environment: 'PRODUCTION',
      status: 'ACTIVE',
      expiresAt: new Date(NOW.getTime() + 3 * DAY),
    });

    await sweepReminders(NOW);
    const titles = await titlesFor(it);

    expect(titles).toContainEqual(expect.stringContaining('LAP-014 is out of warranty'));
    expect(titles).toContainEqual(expect.stringContaining('Figma renews'));
    expect(titles).toContainEqual(expect.stringContaining('certificate expires'));
  });

  it('says how many licence seats are going spare, since that is the decision', async () => {
    const it = await seed(ROLES.IT, 'it2@exyconn.com');
    await LicenceModel.create({
      name: 'Zoom',
      vendor: 'Zoom',
      seatsTotal: 20,
      assigneeIds: ['u1'],
      billingCycle: 'MONTHLY',
      cost: 1000,
      currency: 'INR',
      renewalDate: new Date(NOW.getTime() + 2 * DAY),
      status: 'ACTIVE',
    });

    await sweepReminders(NOW);
    const notice = await NotificationModel.findOne({ employeeId: it }).lean();

    expect(notice?.body).toContain('19 of 20 seats are unused');
  });

  it('leaves retired kit and cancelled licences alone', async () => {
    const it = await seed(ROLES.IT, 'it3@exyconn.com');
    await AssetModel.create({
      assetTag: 'OLD-1',
      name: 'Retired laptop',
      category: 'LAPTOP',
      status: 'RETIRED',
      warrantyExpiry: new Date(NOW.getTime() - 100 * DAY),
    });
    await LicenceModel.create({
      name: 'Old tool',
      vendor: 'Nobody',
      seatsTotal: 1,
      billingCycle: 'YEARLY',
      cost: 1,
      currency: 'INR',
      renewalDate: new Date(NOW.getTime() - DAY),
      status: 'CANCELLED',
    });

    await sweepReminders(NOW);

    expect(await titlesFor(it)).toEqual([]);
  });
});

describe('stock at its reorder level', () => {
  useTestOrganization();

  const product = (name: string, stock: number, reorderLevel: number) =>
    ProductModel.create({
      name,
      sku: name.toUpperCase().replaceAll(' ', '-'),
      category: 'Hardware',
      status: 'ACTIVE',
      price: 100,
      currency: 'INR',
      stock,
      reorderLevel,
    });

  it('sends one notice naming the worst, however many there are', async () => {
    const buyer = await seed(ROLES.PRODUCTS, 'buyer@exyconn.com');
    await product('Cable', 0, 5);
    await product('Mouse', 3, 5);
    for (let index = 0; index < 5; index += 1) {
      await product(`Widget ${index}`, 1, 2);
    }
    await product('Plenty', 500, 5);

    await sweepReminders(NOW);
    const notices = await NotificationModel.find({ employeeId: buyer }).lean();

    expect(notices).toHaveLength(1);
    expect(notices[0].title).toBe('7 products at the reorder level');
    expect(notices[0].body).toContain('Cable (0 left, reorder at 5)');
    expect(notices[0].body).toContain('and 2 more');
  });

  it('ignores a product with no reorder level set', async () => {
    const buyer = await seed(ROLES.PRODUCTS, 'buyer2@exyconn.com');
    await product('Unmanaged', 0, 0);

    await sweepReminders(NOW);

    expect(await titlesFor(buyer)).toEqual([]);
  });
});

describe('people dates', () => {
  useTestOrganization();

  it('chases a probation that is about to end', async () => {
    const hr = await seed(ROLES.HR, 'hr@exyconn.com');
    await UserModel.create({
      name: 'Nikhil Roy',
      email: 'nikhil@exyconn.com',
      passwordHash: 'x',
      roles: [ROLES.EMPLOYEE],
      isActive: true,
      probationEndDate: new Date(NOW.getTime() + 5 * DAY),
    });

    await sweepReminders(NOW);

    expect(await titlesFor(hr)).toContainEqual(
      expect.stringContaining('Nikhil Roy comes off probation'),
    );
  });

  it('tells the joiner about their own overdue tasks and HR about the rest', async () => {
    const hr = await seed(ROLES.HR, 'hr2@exyconn.com');
    const joiner = await seed(ROLES.EMPLOYEE, 'joiner@exyconn.com');
    await OnboardingChecklistModel.create({
      employeeId: joiner,
      employeeName: 'New Joiner',
      templateName: 'Standard onboarding',
      joinDate: new Date(NOW.getTime() - 10 * DAY),
      items: [
        {
          key: 'contract',
          label: 'Sign the contract',
          owner: 'EMPLOYEE',
          dueOn: new Date(NOW.getTime() - 2 * DAY),
          done: false,
        },
        {
          key: 'payroll',
          label: 'Add to payroll',
          owner: 'HR',
          dueOn: new Date(NOW.getTime() - DAY),
          done: false,
        },
        {
          key: 'later',
          label: 'Six-week review',
          owner: 'HR',
          dueOn: new Date(NOW.getTime() + 20 * DAY),
          done: false,
        },
      ],
    });

    await sweepReminders(NOW);

    const joinerTitles = await titlesFor(joiner);
    const hrTitles = await titlesFor(hr);
    expect(joinerTitles).toHaveLength(1);
    expect(hrTitles.filter((title) => title.includes('onboarding'))).toHaveLength(1);
    const hrNotice = await NotificationModel.findOne({
      employeeId: hr,
      title: { $regex: 'onboarding' },
    }).lean();
    expect(hrNotice?.body).toBe('Add to payroll');
  });
});
