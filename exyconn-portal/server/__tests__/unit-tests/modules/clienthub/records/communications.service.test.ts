import { communicationsService } from '../../../../../src/modules/clienthub/records/communications.service';
import { emailer } from '../../../../../src/modules/email/email.service';
import { useTestOrganization } from '../../../../helpers';
import { codeOf } from '../../codeOf';
import { seedClient } from './fixtures';

useTestOrganization();
const PAGE = { page: 0, pageSize: 20 };
const CALL = { type: 'CALL' as const, occurredAt: '2026-10-01T10:00:00.000Z', subject: 'Kick-off' };

let acme: string;
let send: jest.SpyInstance;

beforeEach(async () => {
  send = jest.spyOn(emailer, 'send').mockResolvedValue(undefined);
  acme = await seedClient('Acme', 'dana@acme.test');
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('communication log', () => {
  it('keeps the entry and who logged it, without emailing unless asked', async () => {
    const entry = await communicationsService.create(
      acme,
      { ...CALL, summary: ' Agreed scope ', participants: 'Dana, Arjun' },
      'Arjun',
    );

    expect(entry).toMatchObject({
      subject: 'Kick-off',
      summary: 'Agreed scope',
      participants: 'Dana, Arjun',
      loggedByName: 'Arjun',
      notifiedAt: null,
    });
    expect(send).not.toHaveBeenCalled();
  });

  it('emails the client once, however often the entry is saved with notify', async () => {
    const entry = await communicationsService.create(acme, { ...CALL, notify: true }, 'Arjun');
    await communicationsService.update(String(entry._id), { ...CALL, notify: true });
    const again = await communicationsService.notify(String(entry._id));

    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ template: 'client-hub-communication', to: 'dana@acme.test' }),
    );
    expect(again).toEqual([]);
  });

  it('can email the client later, on an edit that asks for it', async () => {
    const entry = await communicationsService.create(acme, CALL, 'Arjun');

    await communicationsService.update(String(entry._id), { ...CALL, notify: true });

    expect(send).toHaveBeenCalledTimes(1);
  });

  it('lists one client by the staff filter, newest conversation first', async () => {
    const globex = await seedClient('Globex', 'hank@globex.test');
    await communicationsService.create(acme, { ...CALL, subject: 'Older' }, 'A');
    await communicationsService.create(
      acme,
      { ...CALL, subject: 'Newer', occurredAt: '2026-10-05T10:00:00.000Z' },
      'A',
    );
    await communicationsService.create(globex, CALL, 'A');

    const page = await communicationsService.staffPage({
      ...PAGE,
      filters: [{ field: 'clientId', op: 'EQUALS' as const, value: acme }],
    });

    expect(page.rows.map((row) => row.subject)).toEqual(['Newer', 'Older']);
  });

  it.each([
    ['no subject', { ...CALL, subject: ' ' }],
    ['an unknown type', { ...CALL, type: 'FAX' as unknown as 'CALL' }],
    ['no date', { ...CALL, occurredAt: 'soon' }],
  ])('refuses an entry with %s', async (_case, input) => {
    expect(await codeOf(communicationsService.create(acme, input, 'A'))).toBe('BAD_USER_INPUT');
  });

  it('says not found for an entry that is gone', async () => {
    const entry = await communicationsService.create(acme, CALL, 'A');
    await communicationsService.remove(String(entry._id));

    expect(await codeOf(communicationsService.remove(String(entry._id)))).toBe('NOT_FOUND');
    expect(await codeOf(communicationsService.update(String(entry._id), CALL))).toBe('NOT_FOUND');
  });
});
