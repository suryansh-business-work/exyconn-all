import {
  applicantFromSubmission,
  createApplicantFromSubmission,
  setApplicantStage,
} from '../../../../src/modules/recruiting/recruiting.service';
import { ApplicantModel } from '../../../../src/modules/recruiting/applicant.model';
import { JobModel } from '../../../../src/modules/website/models';
import { emailer } from '../../../../src/modules/email';
import { logger } from '../../../../src/utils/logger';
import { codeOf } from '../codeOf';

jest.mock('../../../../src/modules/email', () => ({ emailer: { send: jest.fn() } }));

const sendEmail = emailer.send as jest.Mock;

const seedApplicant = (fields: Record<string, unknown> = {}) =>
  ApplicantModel.create({ name: 'Meera Iyer', email: 'meera@example.com', ...fields });

afterEach(() => jest.restoreAllMocks());

describe('reading a job-application payload', () => {
  it('prefers a full name field over the first and last names', () => {
    expect(applicantFromSubmission({ name: '  Meera Iyer ', firstName: 'X' }, 's', '').name).toBe(
      'Meera Iyer',
    );
    expect(applicantFromSubmission({ fullName: 'Ravi Kumar' }, 's', '').name).toBe('Ravi Kumar');
  });

  it('joins only the name parts that are real text', () => {
    const data = { firstName: 'Meera', lastName: '  ', middle: 'ignored' };

    expect(applicantFromSubmission(data, 's', '').name).toBe('Meera');
    expect(applicantFromSubmission({ firstName: 42, lastName: null }, 's', '').name).toBe('');
  });

  it('takes the job title from the page when the catalogue has none', () => {
    const applicant = applicantFromSubmission({ jobTitle: 'Designer', jobCode: 'D-1' }, 's', '');

    expect(applicant).toMatchObject({ jobTitle: 'Designer', jobCode: 'D-1', resumeUrl: '' });
  });

  it('reads the first resume field that was filled in, ignoring non-text values', () => {
    const data = { resumeUrl: 7, resumeLink: '   ', resume: 'https://cv.example/m.pdf' };

    expect(applicantFromSubmission(data, 's', '').resumeUrl).toBe('https://cv.example/m.pdf');
  });

  it('notes only how the applicant applied when the form sent no extra details', () => {
    const applicant = applicantFromSubmission({ email: 'A@B.CO' }, 'sub-1', 'Engineer');

    expect(applicant.notes).toBe('Applied through the website job-application form.');
    expect(applicant).toMatchObject({ email: 'a@b.co', submissionId: 'sub-1', phone: '' });
  });
});

describe('filing an applicant from a submission', () => {
  it('does not look the job up when the form named no job', async () => {
    const lookup = jest.spyOn(JobModel, 'findOne');

    const created = await createApplicantFromSubmission('s1', {
      name: 'Meera Iyer',
      email: 'meera@example.com',
      jobTitle: 'Walk-in',
    });

    expect(lookup).not.toHaveBeenCalled();
    expect(created).toMatchObject({ jobCode: '', jobTitle: 'Walk-in', source: 'WEBSITE' });
  });

  it('files under the catalogue title when the job code is known', async () => {
    await JobModel.create({
      jobCode: 'ENG-7',
      companySlug: 'exyconn',
      title: 'Platform Engineer',
      category: 'Engineering',
      jobType: 'Full Time',
      experienceLevel: 'Senior',
      workMode: 'Remote',
    });

    const created = await createApplicantFromSubmission('s2', {
      jobCode: 'ENG-7',
      jobTitle: 'Old title',
      name: 'Ravi',
      email: 'ravi@example.com',
    });

    expect(created.jobTitle).toBe('Platform Engineer');
  });
});

describe('moving an applicant', () => {
  it('refuses an applicant that does not exist', async () => {
    const attempt = setApplicantStage('64b7f9c2f1a2b3c4d5e6f7a8', 'OFFER', '', 'hr@exyconn.com');

    expect(await codeOf(attempt)).toBe('NOT_FOUND');
  });

  it('appends a move without a note under the earlier history', async () => {
    const applicant = await seedApplicant({ notes: 'Referred by Asha.' });

    const saved = await setApplicantStage(String(applicant._id), 'HIRED', '  ', 'hr@x.co');

    const lines = saved.notes.split('\n');
    expect(lines[0]).toBe('Referred by Asha.');
    expect(lines[1]).toMatch(/ · Hired by hr@x\.co$/);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('invites to interview, naming the role generically when it has no title', async () => {
    const applicant = await seedApplicant();

    await setApplicantStage(String(applicant._id), 'INTERVIEW', '', 'hr@x.co');

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        template: 'applicant-stage',
        to: 'meera@example.com',
        triggeredBy: 'recruiting pipeline',
        variables: expect.objectContaining({
          jobTitle: 'the role you applied for',
          stageLabel: 'Interview',
          message: expect.stringContaining('invite you to an interview'),
        }),
      }),
    );
  });

  it('logs a stage email that could not be sent, and keeps the move', async () => {
    const applicant = await seedApplicant();
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    sendEmail.mockRejectedValueOnce(new Error('SMTP down'));

    const saved = await setApplicantStage(String(applicant._id), 'REJECTED', '', 'hr@x.co');

    expect(saved.stage).toBe('REJECTED');
    expect(logged).toHaveBeenCalledWith(
      { err: expect.any(Error) },
      `Stage email for applicant ${String(applicant._id)} failed`,
    );
  });
});
