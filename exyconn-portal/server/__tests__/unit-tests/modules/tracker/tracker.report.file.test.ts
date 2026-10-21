import { Types } from 'mongoose';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { TrackerSessionModel } from '../../../../src/modules/tracker/models';
import {
  hoursReportPdfFile,
  reportBranding,
} from '../../../../src/modules/tracker/tracker.report.file';
import { trackerReportResolvers } from '../../../../src/modules/tracker/tracker.report.resolvers';
import { trackerResolvers } from '../../../../src/modules/tracker';
import { ROLES, type Role } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';

useTestOrganization({ locale: 'en-GB' });

const HOUR = 3_600_000;
// 5–11 January 2026 runs Monday to Sunday.
const FROM = new Date('2026-01-05T00:00:00Z');
const TO = new Date('2026-01-12T00:00:00Z');

async function employee(name: string) {
  const user = await UserModel.create({
    name,
    email: `${new Types.ObjectId().toHexString()}@exyconn.com`,
    passwordHash: 'x',
  });
  const id = user._id.toHexString();
  await TrackerSessionModel.create({
    userId: id,
    deviceId: 'd1',
    startedAt: new Date('2026-01-06T09:00:00Z'),
    status: 'stopped',
    activeMs: 3 * HOUR,
  });
  return id;
}

const ctxAs = (id: string, roles: Role[]): GraphQLContext =>
  ({ user: { id, email: `${id}@exyconn.com`, roles } }) as unknown as GraphQLContext;

const pdfOf = (file: { contentBase64: string }) => Buffer.from(file.contentBase64, 'base64');

describe('reportBranding', () => {
  it('reads the company’s name and language', async () => {
    await expect(reportBranding()).resolves.toEqual({ locale: 'en-GB', company: 'Test Co' });
  });
});

describe('hoursReportPdfFile', () => {
  it('returns the PDF as a TableFile named after the employee and the range', async () => {
    const id = await employee('Asha  Rao-Iyer!');

    const file = await hoursReportPdfFile(id, FROM, TO, 'UTC');

    expect(file).toEqual({
      fileName: 'asha-rao-iyer-2026-01-05-hours.pdf',
      mimeType: 'application/pdf',
      contentBase64: expect.any(String),
      rowCount: 7,
    });
    expect(pdfOf(file).subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('falls back to "employee" for a name with no letters or digits', async () => {
    const id = await employee('—');

    const file = await hoursReportPdfFile(id, FROM, TO, 'UTC');

    expect(file.fileName).toBe('employee-2026-01-05-hours.pdf');
  });
});

describe('the hours report resolvers', () => {
  const { Query } = trackerReportResolvers;
  const range = { from: FROM, to: TO, timezone: 'UTC' };

  it('are served by the tracker module', () => {
    expect(trackerResolvers.Query.trackerHoursReportPdf).toBe(Query.trackerHoursReportPdf);
    expect(trackerResolvers.Query.myTrackerHoursReportPdf).toBe(Query.myTrackerHoursReportPdf);
  });

  it('give Tracker staff any employee’s report', async () => {
    const id = await employee('Asha');
    const staff = new Types.ObjectId().toHexString();

    const file = await Query.trackerHoursReportPdf(
      null,
      { userId: id, ...range },
      ctxAs(staff, [ROLES.EMPLOYEE, ROLES.TRACKER]),
    );

    expect(file).toMatchObject({ fileName: 'asha-2026-01-05-hours.pdf', rowCount: 7 });
  });

  it('refuse another employee’s report to somebody without the Tracker role', async () => {
    const id = await employee('Asha');
    const colleague = await employee('Dev');

    await expect(
      codeOf(
        Query.trackerHoursReportPdf(
          null,
          { userId: id, ...range },
          ctxAs(colleague, [ROLES.EMPLOYEE]),
        ),
      ),
    ).resolves.toBe('FORBIDDEN');
  });

  it('give the caller their own report, never another id', async () => {
    const id = await employee('Asha');
    await employee('Dev');

    const file = await Query.myTrackerHoursReportPdf(
      null,
      { ...range, userId: 'someone-else' } as typeof range,
      ctxAs(id, [ROLES.EMPLOYEE]),
    );

    expect(file.fileName).toBe('asha-2026-01-05-hours.pdf');
  });

  it('refuse a caller who is not signed in', async () => {
    await expect(
      codeOf(Query.myTrackerHoursReportPdf(null, range, { user: null } as GraphQLContext)),
    ).resolves.toBe('UNAUTHENTICATED');
  });
});
