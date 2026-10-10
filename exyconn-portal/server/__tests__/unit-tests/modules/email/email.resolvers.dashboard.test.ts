import { randomUUID } from 'node:crypto';
import { emailResolvers } from '../../../../src/modules/email';
import { EmailFragmentModel } from '../../../../src/modules/email/email-fragment.model';
import { EmailTemplateModel } from '../../../../src/modules/email/email-template.model';
import { EmailLogModel } from '../../../../src/modules/email/email-log.model';
import { EmailConfigModel } from '../../../../src/modules/tech/email-config.model';
import { ROLES, type Role } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { freezeClock } from '../../../helpers';

type Resolve = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const Q = emailResolvers.Query as unknown as Record<string, Resolve>;

const as = (roles: Role[]): GraphQLContext => ({
  user: { id: 'u1', email: 'tech@example.com', roles },
});
const tech = as([ROLES.TECH]);

interface Dashboard {
  templates: number;
  activeTemplates: number;
  fragments: number;
  sent: number;
  failed: number;
  configured: boolean;
  days: Array<{ date: string; sent: number; failed: number }>;
  byTemplate: Array<{ key: string; name: string; sent: number; failed: number }>;
  recentFailures: Array<{ id: string; templateKey: string }>;
}

const dashboard = async (days?: number | null) =>
  (await Q.emailDashboard(null, { days }, tech)) as Dashboard;

const log = (templateKey: string, status: 'SENT' | 'FAILED', sentAt: string) =>
  EmailLogModel.create({
    templateKey,
    templateName: templateKey === 'payslip' ? 'Payslip' : 'Reset',
    to: 'someone@example.com',
    subject: 's',
    status,
    sentAt: new Date(sentAt),
  });

beforeEach(() => freezeClock('2026-09-10T12:00:00.000Z'));
afterEach(() => jest.useRealTimers());

describe('emailDashboard', () => {
  it('refuses someone outside Tech', async () => {
    await expect(Q.emailDashboard(null, {}, as([ROLES.EMPLOYEE]))).rejects.toThrow(
      'You do not have access to this resource',
    );
  });

  it('counts the window by day and by template, and lists the latest failures', async () => {
    await EmailTemplateModel.create([
      { key: 'payslip', name: 'Payslip', subject: 's', mjml: 'm' },
      { key: 'reset', name: 'Reset', subject: 's', mjml: 'm', isActive: false },
    ]);
    await EmailFragmentModel.create({ key: 'footer', name: 'Footer', mjml: 'm' });
    await log('payslip', 'SENT', '2026-09-10T08:00:00Z');
    await log('payslip', 'FAILED', '2026-09-09T10:00:00Z');
    await log('reset', 'SENT', '2026-09-08T01:00:00Z');
    await log('reset', 'FAILED', '2026-09-01T09:00:00Z');
    // Stamped ahead of the clock: counted for the template, but no day bar holds it.
    await log('reset', 'FAILED', '2026-09-11T00:00:00Z');
    await log('payslip', 'SENT', '2026-09-12T00:00:00Z');

    const result = await dashboard(3);

    expect(result).toMatchObject({
      templates: 2,
      activeTemplates: 1,
      fragments: 1,
      sent: 3,
      failed: 2,
      configured: false,
    });
    expect(result.days).toEqual([
      { date: '2026-09-08', sent: 1, failed: 0 },
      { date: '2026-09-09', sent: 0, failed: 1 },
      { date: '2026-09-10', sent: 1, failed: 0 },
    ]);
    expect(result.byTemplate).toEqual([
      { key: 'payslip', name: 'Payslip', sent: 2, failed: 1 },
      { key: 'reset', name: 'Reset', sent: 1, failed: 1 },
    ]);
    expect(result.recentFailures.map((row) => row.templateKey)).toEqual([
      'reset',
      'payslip',
      'reset',
    ]);
    expect(result.recentFailures[0].id).toMatch(/^[a-f\d]{24}$/);
  });

  it('defaults to fourteen days and keeps the window between one and ninety', async () => {
    expect((await dashboard()).days).toHaveLength(14);
    const defaulted = (await dashboard(null)).days;
    expect(defaulted.at(-1)).toEqual({
      date: '2026-09-10',
      sent: 0,
      failed: 0,
    });
    expect((await dashboard(0)).days).toEqual([{ date: '2026-09-10', sent: 0, failed: 0 }]);
    expect((await dashboard(1000)).days).toHaveLength(90);
  });

  it('says email is configured once an SMTP configuration is active', async () => {
    await EmailConfigModel.create({
      label: 'SMTP',
      host: 'smtp.example.com',
      username: 'mailer',
      password: `pw-${randomUUID()}`,
      fromAddress: 'no-reply@example.com',
      isActive: true,
    });
    expect((await dashboard()).configured).toBe(true);
  });
});
