import { Types } from 'mongoose';
import { ensureChatTicket } from '../../../../../../../demos/whatsapp-demo/server/src/channel/channel.ticket';
import { WhatsappChatModel } from '../../../../../../../demos/whatsapp-demo/server/src/channel/chat.model';
import { SupportTicketModel } from '../../../../../src/modules/employee/support.model';
import { ClientModel } from '../../../../../src/modules/clients/clients.model';
import { runForOrganization } from '../../../../../src/lib/tenant';
import { chatRecord } from './channel.fixtures';

/** A stored chat, and the record the conversation hands around for it. */
async function storedChat(fields: Record<string, unknown> = {}) {
  const doc = await WhatsappChatModel.create({ waId: '919876543210', name: 'Ravi', ...fields });
  return chatRecord({ id: doc._id.toHexString(), waId: doc.waId, name: doc.name ?? '' });
}

const linkedTicketId = async (chatId: string) =>
  (await WhatsappChatModel.findById(chatId).lean())?.ticketId ?? null;

describe('ensureChatTicket', () => {
  it('files a first message as a WhatsApp customer ticket and links the chat to it', async () => {
    const chat = await storedChat();

    await ensureChatTicket(chat);

    const ticket = await SupportTicketModel.findOne().lean();
    expect(ticket).toMatchObject({
      requesterType: 'CLIENT',
      channel: 'WHATSAPP',
      requesterName: 'Ravi',
      requesterEmail: '',
      subject: 'WhatsApp chat with Ravi',
      category: 'OTHER',
      priority: 'MEDIUM',
      status: 'OPEN',
      clientId: '',
      description:
        'Ravi (+••••••••3210) wrote to the WhatsApp number.\n' +
        'The conversation stays in WhatsApp; open the ticket to see where the chat stands.',
    });
    expect(ticket?.reference).toMatch(/^EXY-/);
    expect(await linkedTicketId(chat.id)).toBe(String(ticket?._id));
  });

  it('names a sender who gave no name by their masked number', async () => {
    const chat = await storedChat({ name: '' });

    await ensureChatTicket(chat);

    expect((await SupportTicketModel.findOne().lean())?.subject).toBe(
      'WhatsApp chat with +••••••••3210',
    );
  });

  it('never attributes the ticket to a client on file without an address', async () => {
    await ClientModel.collection.insertOne({ name: 'Legacy client', email: '' });
    const chat = await storedChat();

    await ensureChatTicket(chat);

    expect(await SupportTicketModel.findOne().lean()).toMatchObject({
      clientId: '',
      clientName: '',
    });
  });

  it('files no second ticket while the first is still open', async () => {
    const chat = await storedChat();
    await ensureChatTicket(chat);
    const first = await linkedTicketId(chat.id);
    await SupportTicketModel.updateOne({ _id: first }, { status: 'IN_PROGRESS' });

    await ensureChatTicket(chat);

    expect(await SupportTicketModel.countDocuments()).toBe(1);
    expect(await linkedTicketId(chat.id)).toBe(first);
  });

  it.each(['RESOLVED', 'CLOSED'])('files a new ticket once the last one is %s', async (status) => {
    const chat = await storedChat();
    await ensureChatTicket(chat);
    const first = await linkedTicketId(chat.id);
    await SupportTicketModel.updateOne({ _id: first }, { status });

    await ensureChatTicket(chat);

    const second = await linkedTicketId(chat.id);
    expect(await SupportTicketModel.countDocuments()).toBe(2);
    expect(second).not.toBe(first);
  });

  it('files a new ticket when the linked one was deleted', async () => {
    const chat = await storedChat({ ticketId: new Types.ObjectId().toHexString() });

    await ensureChatTicket(chat);

    const ticket = await SupportTicketModel.findOne().lean();
    expect(await linkedTicketId(chat.id)).toBe(String(ticket?._id));
  });

  it("files the ticket in the chat's own company", async () => {
    const organizationId = new Types.ObjectId().toHexString();
    const chat = await runForOrganization(organizationId, () => storedChat());

    await runForOrganization(organizationId, () => ensureChatTicket(chat));

    expect(
      await runForOrganization(organizationId, () => SupportTicketModel.countDocuments()),
    ).toBe(1);
    expect(
      await runForOrganization(new Types.ObjectId().toHexString(), () =>
        SupportTicketModel.countDocuments(),
      ),
    ).toBe(0);
  });
});
