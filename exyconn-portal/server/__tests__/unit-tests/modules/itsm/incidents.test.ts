import { Types } from 'mongoose';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';
import { HOUR, itMutation as m, itStaff, person, ctxFor } from './itsm.fixtures';
import type { GraphQLContext } from '../../../../src/middleware/auth';

type IncidentRow = {
  id: string;
  status: string;
  resolvedAt: Date | null;
  timeline: Array<{ status: string; note: string; authorName: string }>;
};

const incident = (status: string, title = 'VPN down') => ({
  title,
  description: 'Nobody can connect',
  severity: 'SEV2',
  category: 'NETWORK',
  status,
  startedAt: new Date(Date.now() - HOUR),
});

describe('IT incidents', () => {
  useTestOrganization();
  let ctx: GraphQLContext;

  beforeEach(async () => {
    ({ ctx } = await itStaff());
  });

  const open = (status: string) =>
    m.createItIncident(null, { input: incident(status) }, ctx) as Promise<IncidentRow>;
  const save = (id: string, status: string, title?: string) =>
    m.updateItIncident(null, { id, input: incident(status, title) }, ctx) as Promise<IncidentRow>;

  it('opens with a first timeline entry by the caller and no resolution', async () => {
    const created = await open('INVESTIGATING');

    expect(created.resolvedAt).toBeNull();
    expect(created.timeline).toHaveLength(1);
    expect(created.timeline[0]).toMatchObject({
      status: 'INVESTIGATING',
      note: 'Incident opened',
      authorName: 'Ira Tech',
    });
  });

  it('stamps the resolution of an incident logged after the fact', async () => {
    const created = await open('RESOLVED');

    expect(created.resolvedAt).toBeInstanceOf(Date);
  });

  it('writes no timeline entry for an edit that keeps the status', async () => {
    const created = await open('IDENTIFIED');

    const edited = await save(created.id, 'IDENTIFIED', 'VPN down in Pune');

    expect(edited.timeline).toHaveLength(1);
    expect(edited).toMatchObject({ status: 'IDENTIFIED', resolvedAt: null });
  });

  it('keeps the original resolution time when a resolved incident is closed', async () => {
    const created = await open('RESOLVED');

    const closed = await save(created.id, 'CLOSED');

    expect(closed.resolvedAt).toEqual(created.resolvedAt);
    expect(closed.timeline.map((entry) => entry.note)).toEqual([
      'Incident opened',
      'Status changed to closed',
    ]);
  });

  it('trims the note of a manual update and names whoever wrote it', async () => {
    const created = await open('INVESTIGATING');
    const ops = ctxFor(await person('Omar Ops', ['IT']));

    const updated = (await m.addItIncidentUpdate(
      null,
      { id: created.id, status: 'MONITORING', note: '  Fix deployed  ' },
      ops,
    )) as IncidentRow;

    expect(updated.status).toBe('MONITORING');
    expect(updated.timeline[1]).toMatchObject({ note: 'Fix deployed', authorName: 'Omar Ops' });
  });

  it('refuses an incident that does not exist', async () => {
    expect(await codeOf(save('nope', 'RESOLVED'))).toBe('NOT_FOUND');
    const missing = m.addItIncidentUpdate(
      null,
      { id: String(new Types.ObjectId()), status: 'RESOLVED', note: 'Done' },
      ctx,
    );
    expect(await codeOf(missing)).toBe('NOT_FOUND');
  });

  it('keeps everyone outside IT from writing to the timeline', async () => {
    const created = await open('INVESTIGATING');
    const employee = ctxFor(await person('Eve Staff'), ['EMPLOYEE']);

    const attempt = m.addItIncidentUpdate(
      null,
      { id: created.id, status: 'RESOLVED', note: 'Done' },
      employee,
    );

    expect(await codeOf(attempt)).toBe('FORBIDDEN');
  });
});
