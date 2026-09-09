import { importInboundMessage } from '../../src/modules/support/inbound-mail';
import { stripQuotedReply } from '../../src/modules/support/inbound-mail.text';
import { ensureSupportSlaPolicies } from '../../src/modules/support/sla.service';
import { supportResolvers } from '../../src/modules/support';
import { SupportTicketModel } from '../../src/modules/employee/support.model';
import { SupportReplyModel } from '../../src/modules/support/support-reply.model';
import { ClientModel } from '../../src/modules/clients/clients.model';
import { imageUploader } from '../../src/utils/imagekit';
import { emailer } from '../../src/modules/email';
import { ROLES } from '../../src/constants/roles';
import { seedUser } from '../helpers';
import type { InboundMessage } from '../../src/utils/inboundMail';
import type { GraphQLContext } from '../../src/middleware/auth';

jest.mock('../../src/utils/imagekit', () => ({
  imageUploader: { uploadImage: jest.fn() },
}));

jest.mock('../../src/modules/email', () => ({
  emailer: { send: jest.fn() },
}));

const uploadImage = imageUploader.uploadImage as jest.Mock;
const sendEmail = emailer.send as jest.Mock;

/** The password only has to exist for the fixture; it is never used to sign in here. */
const AGENT_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'a-strong-password';

const asSupport = (id: string): GraphQLContext => ({
  user: { id, roles: [ROLES.SUPPORT], email: 'agent@exyconn.com' },
});

/** A message as it reaches the importer: already parsed, never off a socket. */
const arriving = (overrides: Partial<InboundMessage> = {}): InboundMessage => ({
  from: 'dana@acme.test',
  fromName: 'Dana Reyes',
  subject: 'Portal will not load',
  body: 'Every page hangs on the spinner since this morning.',
  inReplyTo: '',
  references: '',
  autoSubmitted: '',
  autoReply: false,
  attachments: [],
  ...overrides,
});

const onlyTicket = () => SupportTicketModel.findOne().lean();

describe('Inbound mail becomes a ticket', () => {
  it('files a customer ticket with a reference and a deadline', async () => {
    await ensureSupportSlaPolicies();

    const outcome = await importInboundMessage(arriving());

    expect(outcome).toBe('CREATED');
    const ticket = await onlyTicket();
    expect(ticket).toMatchObject({
      requesterType: 'CLIENT',
      channel: 'EMAIL',
      requesterEmail: 'dana@acme.test',
      requesterName: 'Dana Reyes',
      subject: 'Portal will not load',
      status: 'OPEN',
    });
    expect(ticket?.reference).toMatch(/^EXY-[A-Z2-9]{6}$/);
    expect(ticket?.dueAt).toBeInstanceOf(Date);
  });

  it('attributes the sender to the client on file, exactly as the public form does', async () => {
    await ClientModel.create({
      name: 'Acme Ltd',
      email: 'buyer@acme.test',
      phone: '123',
      company: 'Acme',
    });

    await importInboundMessage(arriving());

    expect((await onlyTicket())?.clientName).toBe('Acme Ltd');
  });

  it('stores only the new part of a reply, not the history quoted under it', async () => {
    const body = [
      'That fixed it, thank you.',
      '',
      'On Mon, 8 Sep 2026 at 10:12, Support <help@exyconn.com> wrote:',
      '> Could you try clearing the cache?',
    ].join('\n');

    await importInboundMessage(arriving({ body }));

    expect((await onlyTicket())?.description).toBe('That fixed it, thank you.');
  });

  it('hangs the mail’s files on the ticket', async () => {
    uploadImage.mockResolvedValue('https://cdn.test/screenshot.png');

    await importInboundMessage(
      arriving({
        attachments: [
          {
            filename: 'screenshot.png',
            contentType: 'image/png',
            content: Buffer.from('binary'),
          },
        ],
      }),
    );

    expect(uploadImage).toHaveBeenCalledWith(
      Buffer.from('binary').toString('base64'),
      'screenshot.png',
      'support',
    );
    expect((await onlyTicket())?.attachments).toMatchObject([
      { url: 'https://cdn.test/screenshot.png', name: 'screenshot.png' },
    ]);
  });

  it('ignores an auto-reply, a bounce and a message with nobody to answer', async () => {
    const ignored = [
      arriving({ autoSubmitted: 'auto-replied' }),
      arriving({ autoReply: true }),
      arriving({ from: 'MAILER-DAEMON@acme.test'.toLowerCase() }),
      arriving({ from: 'postmaster@acme.test' }),
      arriving({ from: '' }),
    ];

    for (const message of ignored) {
      expect(await importInboundMessage(message)).toBe('IGNORED');
    }
    expect(await SupportTicketModel.countDocuments()).toBe(0);
  });
});

describe('Inbound mail on an existing ticket', () => {
  const raise = async () => {
    await importInboundMessage(arriving());
    const ticket = await onlyTicket();
    return { id: String(ticket?._id), reference: ticket?.reference ?? '' };
  };

  it('adds a reply to the ticket whose reference the subject quotes', async () => {
    const ticket = await raise();

    const outcome = await importInboundMessage(
      arriving({
        subject: `Re: [${ticket.reference}] Portal will not load`,
        body: 'Still broken.',
      }),
    );

    expect(outcome).toBe('REPLIED');
    expect(await SupportTicketModel.countDocuments()).toBe(1);
    const replies = await SupportReplyModel.find({ ticketId: ticket.id }).lean();
    expect(replies).toMatchObject([{ body: 'Still broken.', internal: false }]);
  });

  it('finds the reference in the threading headers when the subject was rewritten', async () => {
    const ticket = await raise();

    const outcome = await importInboundMessage(
      arriving({
        subject: 'Re: your message',
        references: `<${ticket.reference}.thread@exyconn.com>`,
      }),
    );

    expect(outcome).toBe('REPLIED');
    expect(await SupportTicketModel.countDocuments()).toBe(1);
  });

  it('does not treat the requester writing back as the desk’s first response', async () => {
    const ticket = await raise();

    await importInboundMessage(arriving({ subject: `Re: ${ticket.reference}` }));

    expect((await onlyTicket())?.firstRespondedAt).toBeNull();
  });

  it('stamps the first response only once an agent has actually replied', async () => {
    const agent = await seedUser('asha@exyconn.com', AGENT_PASSWORD, [ROLES.SUPPORT]);
    const ticket = await raise();
    sendEmail.mockResolvedValue(undefined);

    await supportResolvers.Mutation.addSupportReply(
      null,
      { ticketId: ticket.id, body: 'We are on it.', internal: false },
      asSupport(String(agent._id)),
    );

    expect((await onlyTicket())?.firstRespondedAt).toBeInstanceOf(Date);
  });

  it('opens a ticket of its own for a stranger quoting somebody else’s reference', async () => {
    const ticket = await raise();

    const outcome = await importInboundMessage(
      arriving({ from: 'nosy@elsewhere.test', subject: `Re: ${ticket.reference}` }),
    );

    expect(outcome).toBe('CREATED');
    expect(await SupportReplyModel.countDocuments()).toBe(0);
    expect(await SupportTicketModel.countDocuments()).toBe(2);
  });

  it('recognises the employee’s own address on an employee ticket', async () => {
    const employee = await seedUser('ravi@exyconn.com', AGENT_PASSWORD, [ROLES.EMPLOYEE]);
    const ticket = await SupportTicketModel.create({
      employeeId: String(employee._id),
      reference: 'EXY-AAA222',
      subject: 'Laptop will not boot',
      category: 'IT',
      description: 'It stops at the logo.',
      priority: 'HIGH',
    });

    const outcome = await importInboundMessage(
      arriving({ from: 'ravi@exyconn.com', subject: 'Re: EXY-AAA222', body: 'Still dead.' }),
    );

    expect(outcome).toBe('REPLIED');
    expect(await SupportReplyModel.countDocuments({ ticketId: String(ticket._id) })).toBe(1);
  });
});

describe('Stripping quoted history', () => {
  it('cuts everything from the attribution line down', () => {
    const text = 'Thanks!\n\nOn Mon, 8 Sep 2026 at 10:12, Asha <asha@exyconn.com> wrote:\n> Hello';

    expect(stripQuotedReply(text)).toBe('Thanks!');
  });

  it('cuts at a leading block of quoting', () => {
    expect(stripQuotedReply('No change.\n\n> Have you restarted?\n> Asha')).toBe('No change.');
  });

  it('cuts at the Outlook divider and at its row of underscores', () => {
    expect(stripQuotedReply('Yes please.\n\n-----Original Message-----\nFrom: Asha')).toBe(
      'Yes please.',
    );
    expect(stripQuotedReply('Yes please.\n\n________________________\nFrom: Asha')).toBe(
      'Yes please.',
    );
  });

  it('leaves a message that quotes nothing exactly as it was', () => {
    expect(stripQuotedReply('  Two lines\nof text  ')).toBe('Two lines\nof text');
  });

  it('keeps a message that is nothing but quotation rather than storing nothing', () => {
    expect(stripQuotedReply('> Everything here was quoted')).toBe('> Everything here was quoted');
  });
});
