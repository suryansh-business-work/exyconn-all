import { LicenceModel } from '../../../../src/modules/assets/licence.model';
import { AnnouncementModel } from '../../../../src/modules/announcements/announcement.model';
import {
  ItAccessRequestModel,
  ItChangeModel,
  ItIncidentModel,
  ItPurchaseRequestModel,
  ItVulnerabilityModel,
} from '../../../../src/modules/itsm/models';
import { ROLES } from '../../../../src/constants/roles';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';
import { ctxFor, HOUR, inDays, itQuery as q } from './itsm.fixtures';

type Titled = Array<{ id: string; title: string }>;
type Dashboard = Record<string, number> & {
  recentIncidents: Titled;
  upcomingChanges: Titled;
  announcements: Titled;
};

const it1 = ctxFor('it-1', [ROLES.IT]);
const load = async () => (await q.itDashboard(null, {}, it1)) as Dashboard;

const change = (title: string, status: string, startInHours: number) =>
  ItChangeModel.create({
    title,
    description: 'd',
    system: 'Portal',
    status,
    plannedStart: new Date(Date.now() + startInHours * HOUR),
    plannedEnd: new Date(Date.now() + (startInHours + 1) * HOUR),
  });

describe('IT dashboard', () => {
  useTestOrganization();

  it('counts everything waiting on an IT decision', async () => {
    await ItAccessRequestModel.create([
      { employeeId: 'e1', application: 'Slack', reason: 'r' },
      { employeeId: 'e1', application: 'Jira', reason: 'r', status: 'APPROVED' },
    ]);
    await change('Pending', 'PENDING_APPROVAL', 5);
    await ItPurchaseRequestModel.create([
      { title: 'A', justification: 'j', status: 'REQUESTED' },
      { title: 'B', justification: 'j', status: 'QUOTED' },
      { title: 'C', justification: 'j', status: 'ORDERED' },
    ]);

    const dashboard = await load();

    expect(dashboard).toMatchObject({ pendingAccess: 1, pendingChanges: 1, pendingPurchases: 2 });
  });

  it('counts renewals and open vulnerabilities, critical ones apart', async () => {
    await LicenceModel.create([
      { name: 'Soon', vendor: 'V', seatsTotal: 1, cost: 1, renewalDate: inDays(10) },
      { name: 'Later', vendor: 'V', seatsTotal: 1, cost: 1, renewalDate: inDays(200) },
      {
        name: 'Gone',
        vendor: 'V',
        seatsTotal: 1,
        cost: 1,
        renewalDate: inDays(1),
        status: 'CANCELLED',
      },
    ]);
    const vulnerability = (severity: string, status: string) => ({
      title: `${severity} ${status}`,
      affectedSystem: 'Portal',
      discoveredAt: new Date(),
      severity,
      status,
    });
    await ItVulnerabilityModel.create([
      vulnerability('CRITICAL', 'OPEN'),
      vulnerability('LOW', 'IN_PROGRESS'),
      vulnerability('CRITICAL', 'RESOLVED'),
    ]);

    const dashboard = await load();

    expect(dashboard).toMatchObject({
      licencesRenewing: 1,
      openVulnerabilities: 2,
      criticalVulnerabilities: 1,
      activeIncidents: 0,
      openTickets: 0,
    });
  });

  it('lists the five latest incidents and only changes still to come', async () => {
    for (let hoursAgo = 1; hoursAgo <= 6; hoursAgo += 1) {
      await ItIncidentModel.create({
        title: `Incident ${hoursAgo}`,
        description: 'd',
        startedAt: new Date(Date.now() - hoursAgo * HOUR),
      });
    }
    await change('Later', 'SCHEDULED', 10);
    await change('Sooner', 'APPROVED', 2);
    await change('Over', 'SCHEDULED', -5);
    await change('Draft', 'DRAFT', 3);

    const dashboard = await load();

    expect(dashboard.recentIncidents.map((row) => row.title)).toEqual([
      'Incident 1',
      'Incident 2',
      'Incident 3',
      'Incident 4',
      'Incident 5',
    ]);
    expect(dashboard.upcomingChanges.map((row) => row.title)).toEqual(['Sooner', 'Later']);
  });

  it("shows IT's live announcements, pinned first", async () => {
    await AnnouncementModel.create([
      { title: 'Recent', body: 'b', category: 'OUTAGE', publishedAt: new Date() },
      {
        title: 'Pinned',
        body: 'b',
        category: 'MAINTENANCE',
        pinned: true,
        publishedAt: inDays(-3),
      },
      { title: 'Expired', body: 'b', category: 'SECURITY_ALERT', expiresAt: inDays(-1) },
      {
        title: 'Still on',
        body: 'b',
        category: 'SECURITY_ALERT',
        expiresAt: inDays(2),
        publishedAt: inDays(-1),
      },
      { title: 'Party', body: 'b', category: 'EVENT' },
    ]);

    const dashboard = await load();

    expect(dashboard.announcements.map((row) => row.title)).toEqual([
      'Pinned',
      'Recent',
      'Still on',
    ]);
  });

  it('keeps everyone outside IT out', async () => {
    const employee = ctxFor('emp-1', [ROLES.EMPLOYEE]);

    expect(await codeOf(q.itDashboard(null, {}, employee))).toBe('FORBIDDEN');
  });
});
