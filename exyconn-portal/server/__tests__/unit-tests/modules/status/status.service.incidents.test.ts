import { StatusIncidentModel } from '../../../../src/modules/status/status-incident.model';
import { getStatusOverview } from '../../../../src/modules/status/status.service';

const MINUTE = 60_000;
const ago = (minutes: number) => new Date(Date.now() - minutes * MINUTE);

describe('Status overview incidents', () => {
  it('titles a legacy incident from its service and measures a resolved one', async () => {
    await StatusIncidentModel.create({
      serviceKey: 'website',
      serviceName: 'Website',
      startedAt: ago(90),
      resolvedAt: ago(30),
    });

    const [incident] = (await getStatusOverview(1)).incidents;

    expect(incident.title).toBe('Website is down');
    expect(incident.durationMinutes).toBe(60);
    expect(incident.id).toEqual(expect.any(String));
  });

  it('measures an open incident against now, and never negatively', async () => {
    await StatusIncidentModel.create([
      { serviceKey: 'website', serviceName: 'Website', title: 'Open', startedAt: ago(15) },
      { serviceKey: 'api', serviceName: 'API', title: 'Clock skew', startedAt: ago(-10) },
    ]);

    const incidents = (await getStatusOverview(1)).incidents;
    const byTitle = new Map(incidents.map((incident) => [incident.title, incident]));

    expect(byTitle.get('Open')?.durationMinutes).toBe(15);
    expect(byTitle.get('Clock skew')?.durationMinutes).toBe(0);
  });

  it('gives every timeline entry an id, newest first', async () => {
    await StatusIncidentModel.create({
      serviceKey: 'website',
      serviceName: 'Website',
      title: 'Slow logins',
      startedAt: ago(60),
      updates: [
        { status: 'INVESTIGATING', body: 'Looking', createdAt: ago(60) },
        { status: 'IDENTIFIED', body: 'Found it', createdAt: ago(20) },
      ],
    });

    const [incident] = (await getStatusOverview(1)).incidents;

    expect(incident.updates.map((update) => update.status)).toEqual([
      'IDENTIFIED',
      'INVESTIGATING',
    ]);
    expect(incident.updates.every((update) => typeof update.id === 'string')).toBe(true);
  });
});
