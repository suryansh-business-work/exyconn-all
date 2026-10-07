import { randomUUID } from 'node:crypto';
import mjml2html from 'mjml';
import nodemailer from 'nodemailer';
import { emailer, sendTemplateEmail } from '../../../../src/modules/email/email.service';
import { EmailTemplateModel } from '../../../../src/modules/email/email-template.model';
import { EmailLogModel } from '../../../../src/modules/email/email-log.model';
import { rawHtml } from '../../../../src/modules/email/email.render';
import { EmailConfigModel } from '../../../../src/modules/tech/email-config.model';
import { logger } from '../../../../src/utils/logger';

jest.mock('mjml', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('nodemailer', () => ({ __esModule: true, default: { createTransport: jest.fn() } }));

const compile = mjml2html as unknown as jest.Mock;
const createTransport = nodemailer.createTransport as unknown as jest.Mock;
const sendMail = jest.fn();
/** Never a literal credential: each run makes its own. */
const password = `pw-${randomUUID()}`;

const send = (overrides: Partial<Parameters<typeof sendTemplateEmail>[0]> = {}) =>
  sendTemplateEmail({
    template: 'notice',
    to: 'asha@example.com',
    variables: { name: 'Asha' },
    ...overrides,
  });

const activeConfig = () =>
  EmailConfigModel.create({
    label: 'SMTP',
    host: 'smtp.example.com',
    port: 465,
    secure: true,
    username: 'mailer',
    password,
    fromAddress: 'no-reply@example.com',
    isActive: true,
  });

beforeEach(async () => {
  compile.mockImplementation((markup: string) =>
    Promise.resolve({ html: `<html>${markup}</html>`, errors: [] }),
  );
  sendMail.mockResolvedValue({ messageId: 'm1' });
  createTransport.mockReturnValue({ sendMail });
  jest.spyOn(logger, 'info').mockImplementation(() => undefined);
  jest.spyOn(logger, 'error').mockImplementation(() => undefined);
  await EmailTemplateModel.create({
    key: 'notice',
    name: 'Notice',
    subject: 'For {{name}}',
    mjml: '<mj-text>{{name}} {{table}}</mj-text>',
  });
});

afterEach(() => jest.restoreAllMocks());

describe('sendTemplateEmail refusals', () => {
  it('refuses an unknown template, a switched-off one and a missing SMTP setup', async () => {
    await expect(send({ template: 'nope' })).rejects.toThrow(
      'No email template with the key "nope".',
    );

    await EmailTemplateModel.updateOne({ key: 'notice' }, { isActive: false });
    await expect(send()).rejects.toThrow(
      'The "Notice" template is switched off, so nothing was sent.',
    );

    await EmailTemplateModel.updateOne({ key: 'notice' }, { isActive: true });
    await expect(send()).rejects.toThrow('No active email configuration. Add one in Tech → Email.');

    expect(sendMail).not.toHaveBeenCalled();
    expect(await EmailLogModel.countDocuments()).toBe(0);
  });
});

describe('sendTemplateEmail delivery', () => {
  beforeEach(async () => {
    await activeConfig();
  });

  it('sends through the active SMTP configuration and logs the delivery', async () => {
    const attachment = { filename: 'payslip.pdf', content: Buffer.from('pdf') };

    await send({
      variables: { name: 'Asha', table: rawHtml('<b>1</b>') },
      replyTo: 'hr@example.com',
      triggeredBy: 'payroll',
      attachments: [attachment],
    });

    expect(createTransport).toHaveBeenCalledWith({
      host: 'smtp.example.com',
      port: 465,
      secure: true,
      auth: { user: 'mailer', pass: password },
    });
    expect(sendMail).toHaveBeenCalledWith({
      from: 'no-reply@example.com',
      to: 'asha@example.com',
      subject: 'For Asha',
      html: '<html><mj-text>Asha <b>1</b></mj-text></html>',
      replyTo: 'hr@example.com',
      attachments: [attachment],
    });
    const [log] = await EmailLogModel.find().lean();
    expect(log).toMatchObject({
      templateKey: 'notice',
      templateName: 'Notice',
      to: 'asha@example.com',
      subject: 'For Asha',
      status: 'SENT',
      error: '',
      variables: { name: 'Asha', table: '<b>1</b>' },
      attachments: ['payslip.pdf'],
      triggeredBy: 'payroll',
    });
  });

  it('logs a plain send with no trigger and no attachments', async () => {
    await emailer.send({
      template: 'notice',
      to: 'b@example.com',
      variables: { name: 'B', table: '' },
    });
    const [log] = await EmailLogModel.find().lean();
    expect(log).toMatchObject({ status: 'SENT', triggeredBy: '', attachments: [] });
  });

  it('logs a refused message with the transport’s reason, then rethrows it', async () => {
    sendMail.mockRejectedValue(new Error('550 mailbox unavailable'));

    await expect(send({ variables: { name: 'Asha', table: '' } })).rejects.toThrow(
      '550 mailbox unavailable',
    );

    const [log] = await EmailLogModel.find().lean();
    expect(log).toMatchObject({ status: 'FAILED', error: '550 mailbox unavailable' });
  });

  it('records a generic reason when the transport throws something that is not an Error', async () => {
    sendMail.mockRejectedValue('socket closed');

    await expect(send({ variables: { name: 'Asha', table: '' } })).rejects.toBe('socket closed');

    const [log] = await EmailLogModel.find().lean();
    expect(log).toMatchObject({ status: 'FAILED', error: 'The transport refused the message.' });
  });
});
