import { ProblemReportModel } from '../../../../src/modules/status/problem-report.model';
import {
  notifyReporterOfStatus,
  problemReportStatus,
  PROBLEM_REPORT_UPDATE_TEMPLATE,
} from '../../../../src/modules/status/problem-report.notify';
import { resetReportLimits } from '../../../../src/modules/status/report-rate-limit';
import { emailer } from '../../../../src/modules/email';
import { logger } from '../../../../src/utils/logger';

jest.mock('../../../../src/modules/email', () => ({
  emailer: { send: jest.fn() },
}));

const sendTemplate = emailer.send as jest.Mock;

const updated = {
  _id: 'r1',
  reference: 'EXY-ABC234',
  status: 'IN_PROGRESS',
  serviceName: 'HR Portal',
  reporterName: 'Asha Rao',
  reporterEmail: 'asha@example.com',
  resolutionNotes: 'Investigating the session store',
};

beforeEach(() => resetReportLimits());
afterEach(() => jest.restoreAllMocks());

describe('notifyReporterOfStatus', () => {
  it('words the status the way a reporter would say it', async () => {
    await notifyReporterOfStatus(updated);

    expect(sendTemplate).toHaveBeenCalledWith({
      template: PROBLEM_REPORT_UPDATE_TEMPLATE,
      to: 'asha@example.com',
      variables: {
        name: 'Asha Rao',
        reference: 'EXY-ABC234',
        status: 'In progress',
        serviceName: 'HR Portal',
        resolutionNotes: 'Investigating the session store',
      },
      triggeredBy: 'problem report triage',
    });
  });

  it('fills in a greeting, the platform and a holding note when they are blank', async () => {
    await notifyReporterOfStatus({
      ...updated,
      status: 'TRIAGED',
      reporterName: '',
      serviceName: '',
      resolutionNotes: '',
    });

    expect(sendTemplate.mock.calls[0][0].variables).toEqual({
      name: 'there',
      reference: 'EXY-ABC234',
      status: 'Triaged',
      serviceName: 'the platform',
      resolutionNotes: 'No notes yet — we will update this report.',
    });
  });

  it('sends nothing when the report has no address to write to', async () => {
    await notifyReporterOfStatus({ ...updated, reporterEmail: '' });

    expect(sendTemplate).not.toHaveBeenCalled();
  });

  it('logs a failed email rather than failing the saved triage', async () => {
    const error = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    const outage = new Error('SMTP down');
    sendTemplate.mockRejectedValueOnce(outage);

    await expect(notifyReporterOfStatus(updated)).resolves.toBeUndefined();

    expect(error).toHaveBeenCalledWith(
      { err: outage },
      'Status email for report EXY-ABC234 failed',
    );
  });
});

describe('problemReportStatus', () => {
  it('finds a report by a reference typed with spaces and lower case', async () => {
    const saved = await ProblemReportModel.create({
      subject: 'Cannot sign in',
      description: 'The sign-in button spins forever on every browser.',
      reporterName: 'Asha Rao',
      reporterEmail: 'asha@example.com',
    });

    const status = await problemReportStatus(`  ${saved.reference.toLowerCase()} `);

    expect(status).toEqual({
      reference: saved.reference,
      status: 'NEW',
      serviceName: '',
      updatedAt: expect.any(Date),
    });
  });

  it('shares one lookup bucket between callers with no address', async () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      await expect(problemReportStatus('EXY-NONE00')).rejects.toThrow('No report');
    }

    await expect(problemReportStatus('EXY-NONE00')).rejects.toThrow('Too many lookups');
    await expect(problemReportStatus('EXY-NONE00', '198.51.100.4')).rejects.toThrow('No report');
  });
});
