import { emailResolvers } from '../../../../src/modules/email';
import { emailer } from '../../../../src/modules/email/email.service';
import { EmailLogModel } from '../../../../src/modules/email/email-log.model';
import { ROLES, type Role } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import type { TokenPayload } from '../../../../src/utils/jwt';

type Resolve = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const Q = emailResolvers.Query as unknown as Record<string, Resolve>;
const M = emailResolvers.Mutation as unknown as Record<string, Resolve>;

const as = (roles: Role[]): GraphQLContext => ({
  user: { id: 'u1', email: 'tech@example.com', roles },
});
const tech = as([ROLES.TECH]);
const employee = as([ROLES.EMPLOYEE]);
const rendered = { subject: 'S', html: '<p>h</p>', variables: ['name'], fragments: [] };

const log = (templateKey: string, status: 'SENT' | 'FAILED', sentAt: string) =>
  EmailLogModel.create({
    templateKey,
    to: 'x@example.com',
    subject: 's',
    status,
    sentAt: new Date(sentAt),
  });

afterEach(() => jest.restoreAllMocks());

describe('EmailTemplate field resolvers', () => {
  it('reads the placeholders and fragments out of the markup on every read', () => {
    const template = { subject: 'Hi {{name}}', mjml: '{{> header }}<mj-text>{{amount}}</mj-text>' };
    expect(emailResolvers.EmailTemplate.variables(template)).toEqual(['name', 'amount']);
    expect(emailResolvers.EmailTemplate.fragments(template)).toEqual(['header']);
  });
});

describe('email logs', () => {
  beforeEach(async () => {
    await log('payslip', 'SENT', '2026-09-01T00:00:00Z');
    await log('payslip', 'FAILED', '2026-09-03T00:00:00Z');
    await log('reset', 'SENT', '2026-09-02T00:00:00Z');
  });

  it('pages the log newest first', async () => {
    const page = (await Q.listEmailLogsPaged(null, { input: { page: 0, pageSize: 2 } }, tech)) as {
      rows: Array<{ id: string; sentAt: Date }>;
      totalCount: number;
    };
    expect(page.totalCount).toBe(3);
    expect(page.rows.map((row) => row.sentAt.toISOString().slice(0, 10))).toEqual([
      '2026-09-03',
      '2026-09-02',
    ]);
    expect(page.rows[0].id).toMatch(/^[a-f\d]{24}$/);
  });

  it('counts the log by status', async () => {
    const stats = (await Q.listEmailLogsStats(null, {}, tech)) as {
      total: number;
      counts: Array<{ field: string; buckets: Array<{ value: string; count: number }> }>;
      sums: unknown[];
    };
    expect(stats.total).toBe(3);
    expect(stats.sums).toEqual([]);
    expect(stats.counts[0].field).toBe('status');
    const buckets = [...stats.counts[0].buckets].sort((a, b) => a.value.localeCompare(b.value));
    expect(buckets).toEqual([
      { value: 'FAILED', count: 1 },
      { value: 'SENT', count: 2 },
    ]);
  });

  it('keeps the log to Tech', async () => {
    await expect(
      Q.listEmailLogsPaged(null, { input: { page: 0, pageSize: 2 } }, employee),
    ).rejects.toThrow('You do not have access to this resource');
    await expect(Q.listEmailLogsStats(null, {}, employee)).rejects.toThrow(
      'You do not have access to this resource',
    );
  });
});

describe('previewEmailTemplate', () => {
  it('renders with the values given as a list', async () => {
    const render = jest.spyOn(emailer, 'render').mockResolvedValue(rendered);
    await expect(
      Q.previewEmailTemplate(
        null,
        { key: 'k', variables: [{ name: 'name', value: 'Asha' }] },
        tech,
      ),
    ).resolves.toEqual(rendered);
    expect(render).toHaveBeenCalledWith('k', { name: 'Asha' });

    await Q.previewEmailTemplate(null, { key: 'k', variables: null }, tech);
    expect(render).toHaveBeenLastCalledWith('k', {});
  });

  it('turns a render failure into a message the editor can show', async () => {
    const render = jest
      .spyOn(emailer, 'render')
      .mockRejectedValueOnce(new Error('Missing value for: name'));
    await expect(Q.previewEmailTemplate(null, { key: 'k' }, tech)).rejects.toMatchObject({
      message: 'Missing value for: name',
      extensions: { code: 'BAD_USER_INPUT' },
    });
    render.mockRejectedValueOnce('odd');
    await expect(Q.previewEmailTemplate(null, { key: 'k' }, tech)).rejects.toThrow(
      'The template could not be rendered.',
    );
  });

  it('keeps previews to Tech', async () => {
    const render = jest.spyOn(emailer, 'render');
    await expect(Q.previewEmailTemplate(null, { key: 'k' }, employee)).rejects.toThrow(
      'You do not have access to this resource',
    );
    expect(render).not.toHaveBeenCalled();
  });
});

describe('sendTestEmailTemplate', () => {
  it('sends through the real path as the signed-in person', async () => {
    const send = jest.spyOn(emailer, 'send').mockResolvedValue(undefined);
    await expect(
      M.sendTestEmailTemplate(
        null,
        { key: 'k', to: 'me@example.com', variables: [{ name: 'a', value: '1' }] },
        tech,
      ),
    ).resolves.toBe(true);
    expect(send).toHaveBeenCalledWith({
      template: 'k',
      to: 'me@example.com',
      variables: { a: '1' },
      triggeredBy: 'tech@example.com',
    });
  });

  it('names the caller by id when the session carries no email', async () => {
    const send = jest.spyOn(emailer, 'send').mockResolvedValue(undefined);
    const user = { id: 'u7', roles: [ROLES.TECH] } as unknown as TokenPayload;
    await M.sendTestEmailTemplate(null, { key: 'k', to: 'me@example.com' }, { user });
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ triggeredBy: 'u7', variables: {} }),
    );
  });

  it('turns a failed send into a message, with a fallback for odd errors', async () => {
    const send = jest.spyOn(emailer, 'send').mockRejectedValueOnce(new Error('SMTP down'));
    await expect(
      M.sendTestEmailTemplate(null, { key: 'k', to: 'a@example.com' }, tech),
    ).rejects.toThrow('SMTP down');
    send.mockRejectedValueOnce(42);
    await expect(
      M.sendTestEmailTemplate(null, { key: 'k', to: 'a@example.com' }, tech),
    ).rejects.toThrow('The test email could not be sent.');
  });

  it('refuses someone outside Tech', async () => {
    await expect(
      M.sendTestEmailTemplate(null, { key: 'k', to: 'a@example.com' }, employee),
    ).rejects.toThrow('You do not have access to this resource');
  });
});
