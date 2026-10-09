import { StatusMonitorModel } from '../../../../src/modules/status/status-monitor.model';
import { ProblemReportModel } from '../../../../src/modules/status/problem-report.model';
import { submitProblemReport } from '../../../../src/modules/status/problem-report.service';
import {
  allowReportAttempt,
  resetReportLimits,
} from '../../../../src/modules/status/report-rate-limit';
import { newReference } from '../../../../src/modules/status/reference';

const report = {
  serviceKey: 'hr',
  category: 'LOGIN',
  severity: 'MEDIUM',
  subject: 'Cannot sign in to HR',
  description: 'The sign-in button spins forever on every browser I tried.',
  reporterName: 'Asha Rao',
  reporterEmail: 'asha@example.com',
  pageUrl: '',
};

const HOUR_MS = 60 * 60 * 1000;

beforeEach(async () => {
  await resetReportLimits();
  await StatusMonitorModel.create({
    key: 'hr',
    name: 'HR Portal',
    category: 'PORTAL',
    url: 'https://hr.example.test',
  });
});
afterEach(() => jest.restoreAllMocks());

describe('newReference', () => {
  it('uses only characters that cannot be misread', () => {
    const references = Array.from({ length: 50 }, () => newReference());

    expect(references.every((reference) => /^EXY-[A-HJ-NP-Z2-9]{6}$/.test(reference))).toBe(true);
  });
});

describe('submitProblemReport validation', () => {
  it.each([
    ['reporterName', ' A ', 'Name must be at least 2 characters'],
    ['reporterName', 'n'.repeat(81), 'Name must be at most 80 characters'],
    ['subject', 'Hey', 'Subject must be at least 5 characters'],
    ['subject', 's'.repeat(121), 'Subject must be at most 120 characters'],
    ['description', 'd'.repeat(4001), 'Description must be at most 4000 characters'],
    [
      'pageUrl',
      `https://exyconn.com/${'p'.repeat(481)}`,
      'Page URL must be at most 500 characters',
    ],
    ['reporterEmail', 'asha@example.c', 'Enter a valid email address'],
  ])('rejects %s = %p', async (field, value, message) => {
    await expect(submitProblemReport({ ...report, [field]: value })).rejects.toThrow(message);
    expect(await ProblemReportModel.countDocuments()).toBe(0);
  });

  it('accepts values exactly at the limits', async () => {
    const receipt = await submitProblemReport({
      ...report,
      reporterName: 'Al',
      subject: 's'.repeat(120),
      description: 'd'.repeat(20),
    });

    expect(receipt.submittedAt).toBeInstanceOf(Date);
    expect(await ProblemReportModel.countDocuments({ reference: receipt.reference })).toBe(1);
  });

  it('refuses a service that has been deactivated', async () => {
    await StatusMonitorModel.updateOne({ key: 'hr' }, { isActive: false });

    await expect(submitProblemReport(report)).rejects.toThrow('Choose a service from the list');
  });

  it('stores the trimmed text, not what was typed around it', async () => {
    const receipt = await submitProblemReport({
      ...report,
      subject: '  Cannot sign in to HR  ',
      reporterName: '  Asha Rao ',
      pageUrl: ' https://hr.exyconn.com/login ',
    });

    const saved = await ProblemReportModel.findOne({ reference: receipt.reference }).lean();
    expect(saved).toMatchObject({
      subject: 'Cannot sign in to HR',
      reporterName: 'Asha Rao',
      pageUrl: 'https://hr.exyconn.com/login',
      serviceName: 'HR Portal',
    });
  });
});

describe('report rate limits', () => {
  it('lets a client make ten attempts an hour in the shared store', async () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      await expect(allowReportAttempt('198.51.100.1')).resolves.toBe(true);
    }

    await expect(allowReportAttempt('198.51.100.1')).resolves.toBe(false);
    await expect(allowReportAttempt('198.51.100.2')).resolves.toBe(true);

    await resetReportLimits();
    await expect(allowReportAttempt('198.51.100.1')).resolves.toBe(true);
  });
});
