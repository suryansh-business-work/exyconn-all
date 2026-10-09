import { env } from '../../../src/config/env';
import { ROLES } from '../../../src/constants/roles';
import { logger } from '../../../src/utils/logger';
import { ConfigurationError } from '../../../src/utils/errors';
import {
  EmailConfigModel,
  type EmailConfigDocument,
} from '../../../src/modules/tech/email-config.model';
import { asArg } from '../../mockAs';

const mockSendMail = jest.fn();
const mockCreateTransport = jest.fn((_options: unknown) => ({ sendMail: mockSendMail }));
const mockMjml = jest.fn((_mjml: string) => ({
  html: '<html>rendered</html>',
  errors: [] as unknown[],
}));

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: { createTransport: (options: unknown) => mockCreateTransport(options) },
}));
jest.mock('mjml', () => ({
  __esModule: true,
  default: (mjml: string) => mockMjml(mjml),
}));

// The harness stubs the mailer for every suite; this one tests the real thing.
const { mailer } = jest.requireActual<typeof import('../../../src/utils/mailer')>(
  '../../../src/utils/mailer',
);

const config = {
  label: 'Primary SMTP',
  host: 'smtp.acme.test',
  port: 465,
  secure: true,
  username: 'mailer@acme.test',
  password: `smtp-${Date.now()}`,
  fromAddress: 'noreply@acme.test',
  isActive: true,
} as EmailConfigDocument;

function activeConfig(value: EmailConfigDocument | null) {
  return jest
    .spyOn(EmailConfigModel, 'findOne')
    .mockReturnValue(asArg({ lean: jest.fn().mockResolvedValue(value) }));
}

const lastMjml = () => mockMjml.mock.calls[0][0];

let info: jest.SpyInstance;
let error: jest.SpyInstance;

beforeEach(() => {
  mockSendMail.mockResolvedValue(undefined);
  mockMjml.mockReturnValue({ html: '<html>rendered</html>', errors: [] });
  info = jest.spyOn(logger, 'info').mockImplementation(() => undefined);
  error = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('sending through the active configuration', () => {
  it('refuses when no email configuration is active', async () => {
    activeConfig(null);
    const sending = mailer.sendCustomEmail({
      name: 'A',
      email: 'a@x.co',
      subject: 's',
      message: 'm',
    });
    await expect(sending).rejects.toBeInstanceOf(ConfigurationError);
    await expect(sending).rejects.toThrow('No active email configuration');
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('sends the welcome email with the SMTP credentials and logs a masked address', async () => {
    activeConfig(config);
    await mailer.sendWelcomeEmail({
      name: 'Asha Rao',
      email: 'asha@acme.test',
      password: `temp-${Date.now()}`,
      roles: [ROLES.EMPLOYEE],
    });
    expect(mockCreateTransport).toHaveBeenCalledWith({
      host: 'smtp.acme.test',
      port: 465,
      secure: true,
      auth: { user: 'mailer@acme.test', pass: config.password },
    });
    expect(lastMjml()).toContain('Asha Rao');
    expect(lastMjml()).toContain(env.appUrl);
    expect(mockSendMail).toHaveBeenCalledWith({
      from: 'noreply@acme.test',
      to: 'asha@acme.test',
      subject: 'Welcome to Exyconn Portal — your account is ready',
      html: '<html>rendered</html>',
      replyTo: undefined,
    });
    expect(info).toHaveBeenCalledWith(expect.stringContaining('as**@acme.test'));
    expect(error).not.toHaveBeenCalled();
  });

  it('still sends, and logs the problems, when MJML reports errors', async () => {
    activeConfig(config);
    mockMjml.mockReturnValue({ html: '<html>partial</html>', errors: [{ message: 'bad tag' }] });
    await mailer.sendCredentialsEmail({
      name: 'Ravi',
      email: 'ravi@acme.test',
      password: `temp-${Date.now()}`,
    });
    expect(error).toHaveBeenCalledWith(
      { errors: [{ message: 'bad tag' }] },
      expect.stringContaining('Your Exyconn Portal password has been reset'),
    );
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ html: '<html>partial</html>', to: 'ravi@acme.test' }),
    );
  });

  it('uses the caller subject for a custom email', async () => {
    activeConfig(config);
    await mailer.sendCustomEmail({
      name: 'Dana',
      email: 'dana@acme.test',
      subject: 'Quarterly review',
      message: 'See you Monday',
    });
    expect(lastMjml()).toContain('See you Monday');
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'Quarterly review', to: 'dana@acme.test' }),
    );
  });

  it('links the tracker download page in the access email', async () => {
    activeConfig(config);
    await mailer.sendTrackerAccessEmail({ name: 'Meera', email: 'meera@acme.test' });
    expect(lastMjml()).toContain(env.trackerDownloadUrl);
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'meera@acme.test',
        subject: 'Exyconn Tracker — your access is ready, start tracking your work',
      }),
    );
  });

  it('sends a website form to the configuration own address, replying to the visitor', async () => {
    activeConfig(config);
    await mailer.sendFormSubmissionEmail({
      formType: 'contact',
      submissionData: { name: 'Visitor', message: 'Hello' },
      replyTo: 'visitor@example.test',
    });
    expect(mockSendMail).toHaveBeenCalledWith({
      from: 'noreply@acme.test',
      to: 'noreply@acme.test',
      subject: 'Website form: contact',
      html: '<html>rendered</html>',
      replyTo: 'visitor@example.test',
    });
  });
});

describe('sendTestEmail', () => {
  it('sends through the given configuration without reading the active one', async () => {
    const findOne = activeConfig(null);
    await mailer.sendTestEmail(config, 'admin@acme.test');
    expect(findOne).not.toHaveBeenCalled();
    expect(lastMjml()).toContain('Primary SMTP');
    expect(mockSendMail).toHaveBeenCalledWith({
      from: 'noreply@acme.test',
      to: 'admin@acme.test',
      subject: 'Exyconn Portal — SMTP test email',
      html: '<html>rendered</html>',
    });
    expect(info).toHaveBeenCalledWith(expect.stringContaining('via config "Primary SMTP"'));
    expect(error).not.toHaveBeenCalled();
  });

  it('logs MJML errors for the test email', async () => {
    mockMjml.mockReturnValue({ html: '<html/>', errors: [{ message: 'oops' }] });
    await mailer.sendTestEmail(config, 'admin@acme.test');
    expect(error).toHaveBeenCalledWith(
      { errors: [{ message: 'oops' }] },
      'MJML compilation produced errors for test email',
    );
  });

  it('passes on a delivery failure', async () => {
    mockSendMail.mockRejectedValue(new Error('535 auth failed'));
    await expect(mailer.sendTestEmail(config, 'admin@acme.test')).rejects.toThrow(
      '535 auth failed',
    );
  });
});
