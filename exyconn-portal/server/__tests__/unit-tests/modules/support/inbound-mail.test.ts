import { Types } from 'mongoose';
import {
  findReference,
  importInboundMessage,
  isAutomated,
} from '../../../../src/modules/support/inbound-mail';
import { SupportTicketModel } from '../../../../src/modules/employee/support.model';
import { SupportReplyModel } from '../../../../src/modules/support/support-reply.model';
import { ClientModel } from '../../../../src/modules/clients/clients.model';
import { imageUploader } from '../../../../src/utils/imagekit';
import type { InboundMessage } from '../../../../src/utils/inboundMail';

jest.mock('../../../../src/utils/imagekit', () => ({
  imageUploader: { uploadImage: jest.fn() },
}));
jest.mock('../../../../src/modules/email', () => ({ emailer: { send: jest.fn() } }));

const uploadImage = jest.mocked(imageUploader.uploadImage);

const arriving = (overrides: Partial<InboundMessage> = {}): InboundMessage => ({
  from: 'dana@acme.test',
  fromName: 'Dana Reyes',
  subject: 'Portal will not load',
  body: 'Every page hangs.',
  inReplyTo: '',
  references: '',
  autoSubmitted: '',
  autoReply: false,
  attachments: [],
  ...overrides,
});

const screenshot = { filename: 'shot.png', contentType: 'image/png', content: Buffer.from('png') };

const onlyTicket = () => SupportTicketModel.findOne().lean();

const filedTicket = (extra: Record<string, unknown>) =>
  SupportTicketModel.create({
    reference: 'EXY-AAA222',
    subject: 'Earlier request',
    category: 'OTHER',
    description: 'Earlier.',
    ...extra,
  });

describe('findReference and isAutomated', () => {
  it('reads a lower-case reference from In-Reply-To, and nothing from a message without one', () => {
    expect(findReference(arriving({ inReplyTo: '<exy-abc234@exyconn.com>' }))).toBe('EXY-ABC234');
    expect(findReference(arriving())).toBe('');
  });

  it('treats an explicit "no" auto-submission as a person writing', () => {
    expect(isAutomated(arriving({ autoSubmitted: 'no' }))).toBe(false);
    expect(isAutomated(arriving({ autoSubmitted: 'auto-generated' }))).toBe(true);
  });
});

describe('importInboundMessage — new tickets', () => {
  it('names the ticket after the sender address and a stock subject when the mail has neither', async () => {
    await importInboundMessage(arriving({ fromName: '', subject: '', body: '' }));

    expect(await onlyTicket()).toMatchObject({
      requesterName: 'dana@acme.test',
      subject: 'Support request by email',
      description: 'Support request by email',
    });
  });

  it('uses the subject as the description of a mail that carried only a file', async () => {
    uploadImage.mockResolvedValue('https://cdn.test/shot.png');

    await importInboundMessage(arriving({ body: '', attachments: [screenshot] }));

    const ticket = await onlyTicket();
    expect(ticket?.description).toBe('Portal will not load');
    expect(ticket?.attachments).toMatchObject([{ uploadedBy: 'Dana Reyes' }]);
  });

  it('never matches a sender with no domain to a client by domain', async () => {
    await ClientModel.create({
      name: 'Acme Ltd',
      email: 'buyer@acme.test',
      phone: '1',
      company: 'A',
    });

    expect(await importInboundMessage(arriving({ from: 'dana' }))).toBe('CREATED');

    expect(await onlyTicket()).toMatchObject({
      requesterEmail: 'dana',
      clientId: '',
      clientName: '',
    });
  });

  it('opens a new ticket when the quoted reference matches nothing on file', async () => {
    expect(await importInboundMessage(arriving({ subject: 'Re: EXY-ZZZ999' }))).toBe('CREATED');

    expect(await SupportTicketModel.countDocuments()).toBe(1);
    expect(await SupportReplyModel.countDocuments()).toBe(0);
  });
});

describe('importInboundMessage — replies', () => {
  it('records an emailed file-only reply under the sender address with a placeholder body', async () => {
    const ticket = await filedTicket({ requesterType: 'CLIENT', requesterEmail: 'dana@acme.test' });
    uploadImage.mockResolvedValue('https://cdn.test/shot.png');

    const outcome = await importInboundMessage(
      arriving({ fromName: '', subject: 'Re: EXY-AAA222', body: '', attachments: [screenshot] }),
    );

    expect(outcome).toBe('REPLIED');
    const reply = await SupportReplyModel.findOne({ ticketId: ticket._id.toHexString() }).lean();
    expect(reply).toMatchObject({
      authorId: 'inbound-mail',
      authorName: 'dana@acme.test',
      body: '(no message body)',
      internal: false,
    });
    expect(reply?.attachments).toMatchObject([{ url: 'https://cdn.test/shot.png' }]);
  });

  it('does not honour a reference on an employee ticket whose account is gone', async () => {
    await filedTicket({ employeeId: new Types.ObjectId().toHexString() });

    expect(await importInboundMessage(arriving({ subject: 'Re: EXY-AAA222' }))).toBe('CREATED');
    expect(await SupportTicketModel.countDocuments()).toBe(2);
  });

  it('does not honour a reference on a ticket that names no requester at all', async () => {
    await filedTicket({ employeeId: '' });

    expect(await importInboundMessage(arriving({ subject: 'Re: EXY-AAA222' }))).toBe('CREATED');
    expect(await SupportReplyModel.countDocuments()).toBe(0);
  });
});
