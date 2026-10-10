import { Types } from 'mongoose';
import { StatusMonitorModel } from '../../../../src/modules/status/status-monitor.model';
import { StatusIncidentModel } from '../../../../src/modules/status/status-incident.model';
import { announceIncident } from '../../../../src/modules/status/status.alerts';
import {
  addStatusIncidentUpdate,
  createStatusIncident,
} from '../../../../src/modules/status/status.incidents';

jest.mock('../../../../src/modules/status/status.alerts', () => ({
  announceIncident: jest.fn(),
}));

const announce = announceIncident as jest.Mock;
const author = 'ops@exyconn.com';

const input = {
  title: '  Slow logins  ',
  impact: 'MINOR' as const,
  affectedServiceKeys: ['api', 'hr', 'legacy'],
  body: '  Sign-in takes a minute  ',
};

beforeEach(() =>
  StatusMonitorModel.create([
    { key: 'hr', name: 'HR Portal', category: 'PORTAL', url: 'https://hr.example.test', order: 0 },
    { key: 'api', name: 'Portal API', category: 'API', url: 'https://api.example.test', order: 1 },
    {
      key: 'legacy',
      name: 'Legacy',
      category: 'PORTAL',
      url: 'https://old.example.test',
      order: 2,
      isActive: false,
    },
  ]),
);

describe('createStatusIncident', () => {
  it('refuses an incident with a blank title', async () => {
    await expect(createStatusIncident({ ...input, title: '   ' }, author)).rejects.toThrow(
      'Give the incident a title',
    );
    expect(await StatusIncidentModel.countDocuments()).toBe(0);
  });

  it('files a minor incident as degraded, trimmed, without inactive services', async () => {
    const incident = await createStatusIncident(input, author);

    expect(incident).toMatchObject({
      title: 'Slow logins',
      state: 'DEGRADED',
      impact: 'MINOR',
      serviceKey: 'hr',
      affectedServiceKeys: ['hr', 'api'],
      reason: 'Sign-in takes a minute',
    });
    expect(incident.updates[0]).toMatchObject({
      status: 'INVESTIGATING',
      body: 'Sign-in takes a minute',
      authorName: author,
    });
  });

  it('files a major incident as down', async () => {
    const incident = await createStatusIncident({ ...input, impact: 'MAJOR' }, author);

    expect(incident.state).toBe('DOWN');
  });
});

describe('addStatusIncidentUpdate', () => {
  it('refuses an incident that does not exist', async () => {
    await expect(
      addStatusIncidentUpdate(new Types.ObjectId().toHexString(), 'IDENTIFIED', 'Found it', author),
    ).rejects.toThrow('Incident not found');
  });

  it('appends a progress update without telling anybody', async () => {
    const incident = await createStatusIncident(input, author);

    const updated = await addStatusIncidentUpdate(
      incident._id.toHexString(),
      'IDENTIFIED',
      '  A bad cache node  ',
      author,
    );

    expect(updated.resolvedAt).toBeNull();
    expect(updated.updates.at(-1)).toMatchObject({
      status: 'IDENTIFIED',
      body: 'A bad cache node',
    });
    expect(announce).not.toHaveBeenCalled();
  });

  it('closes on RESOLVED and announces it with the service URL', async () => {
    const incident = await createStatusIncident(input, author);

    const updated = await addStatusIncidentUpdate(
      incident._id.toHexString(),
      'RESOLVED',
      ' Cache replaced ',
      author,
    );

    expect(updated.resolvedAt).toBeInstanceOf(Date);
    expect(announce).toHaveBeenCalledWith(
      'RESOLVED',
      { key: 'hr', name: 'HR Portal', url: 'https://hr.example.test' },
      'Cache replaced',
    );
  });

  it('still announces the recovery when the monitor has since been deleted', async () => {
    const incident = await createStatusIncident(input, author);
    await StatusMonitorModel.deleteOne({ key: 'hr' });

    await addStatusIncidentUpdate(incident._id.toHexString(), 'RESOLVED', 'Done', author);

    expect(announce).toHaveBeenCalledWith(
      'RESOLVED',
      { key: 'hr', name: 'HR Portal', url: '' },
      'Done',
    );
  });
});
