import { buildInvoiceFromTimeLog } from '../../../../src/modules/finance/invoice.from-timelog';
import { InvoiceModel } from '../../../../src/modules/finance/finance.model';
import { ClientModel } from '../../../../src/modules/clients/clients.model';
import { ProjectModel } from '../../../../src/modules/projects/projects.model';
import { trackerBillingService } from '../../../../src/modules/tracker/tracker.billing.service';
import { useTestOrganization } from '../../../helpers';

useTestOrganization();

const FROM = new Date('2026-09-01T00:00:00.000Z');
const TO = new Date('2026-10-01T00:00:00.000Z');

const seedProject = async (clientId: string | null) =>
  (
    await ProjectModel.create({ name: 'Portal', status: 'ACTIVE', clientId, clientName: '' })
  )._id.toHexString();

const seedClient = async () => {
  const client = await ClientModel.create({
    name: 'Priya',
    email: 'priya@acme.test',
    company: 'Acme',
    status: 'ACTIVE',
  });
  return client;
};

afterEach(() => jest.restoreAllMocks());

describe('buildInvoiceFromTimeLog', () => {
  it('refuses a period that does not end after it starts', async () => {
    await expect(buildInvoiceFromTimeLog('any', TO, FROM)).rejects.toThrow(
      /must end after it starts/,
    );
    await expect(buildInvoiceFromTimeLog('any', FROM, FROM)).rejects.toThrow(
      /must end after it starts/,
    );
  });

  it('refuses a project that does not exist', async () => {
    await expect(buildInvoiceFromTimeLog('64b7f9c2f1a2b3c4d5e6f7a8', FROM, TO)).rejects.toThrow(
      /Project not found/,
    );
  });

  it('refuses a project whose client has been deleted', async () => {
    const projectId = await seedProject('64b7f9c2f1a2b3c4d5e6f7a8');

    await expect(buildInvoiceFromTimeLog(projectId, FROM, TO)).rejects.toThrow(/Client not found/);
  });

  it('refuses when the project has no billing row for the period at all', async () => {
    const client = await seedClient();
    const projectId = await seedProject(client._id.toHexString());
    jest.spyOn(trackerBillingService, 'billingByProject').mockResolvedValueOnce([]);

    await expect(buildInvoiceFromTimeLog(projectId, FROM, TO)).rejects.toThrow(/no billable hours/);
    expect(await InvoiceModel.countDocuments()).toBe(0);
  });

  it('names every unpriced employee at once', async () => {
    const client = await seedClient();
    const projectId = await seedProject(client._id.toHexString());
    jest.spyOn(trackerBillingService, 'billingByProject').mockResolvedValueOnce([
      {
        currency: 'USD',
        employees: [
          { employeeName: 'asha', hours: 2, rate: 0 },
          { employeeName: 'ravi', hours: 1, rate: 100 },
          { employeeName: 'meera', hours: 3, rate: -1 },
        ],
      },
    ] as never);

    await expect(buildInvoiceFromTimeLog(projectId, FROM, TO)).rejects.toThrow(
      'No billing rate is set for asha, meera. Set one on their salary structure in HR.',
    );
  });

  it('raises the draft in the billing currency with a blank place of supply when none is set', async () => {
    const client = await seedClient();
    await ClientModel.collection.updateOne({ _id: client._id }, { $unset: { stateCode: '' } });
    const projectId = await seedProject(client._id.toHexString());
    jest
      .spyOn(trackerBillingService, 'billingByProject')
      .mockResolvedValueOnce([
        { currency: 'GBP', employees: [{ employeeName: 'asha', hours: 2, rate: 100 }] },
      ] as never);

    const invoice = await buildInvoiceFromTimeLog(projectId, FROM, TO);

    expect(invoice).toMatchObject({
      currency: 'GBP',
      status: 'DRAFT',
      placeOfSupplyStateCode: '',
      projectId,
      periodFrom: FROM,
      periodTo: TO,
    });
    expect(invoice.lines[0]).toMatchObject({ quantity: 2, rate: 100 });
  });
});
