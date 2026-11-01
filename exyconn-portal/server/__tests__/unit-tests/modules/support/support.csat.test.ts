import { Types } from 'mongoose';
import { SupportTicketModel } from '../../../../src/modules/employee/support.model';
import {
  SUPPORT_CSAT_TEMPLATE,
  csatSummary,
  sendCsatSurvey,
  submitSupportCsat,
  supportCsatSurvey,
} from '../../../../src/modules/support/support.csat';
import { supportResolvers } from '../../../../src/modules/support/support.resolvers';
import { supportTicketFields } from '../../../../src/modules/support/support.fields';
import { emailer } from '../../../../src/modules/email';
import { logger } from '../../../../src/utils/logger';
import { runForOrganization } from '../../../../src/lib/tenant';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';

jest.mock('../../../../src/modules/email', () => ({ emailer: { send: jest.fn() } }));

const send = emailer.send as jest.Mock;

const customerTicket = (extra: Record<string, unknown> = {}) =>
  SupportTicketModel.create({
    requesterType: 'CLIENT',
    requesterName: 'Asha Rao',
    requesterEmail: 'asha@acme.test',
    reference: 'EXY-ABC123',
    subject: 'Invoice is wrong',
    description: 'The total is off.',
    ...extra,
  });

/** The one-time token the survey email carried, read off the link it was sent. */
function sentToken(call = 0): string {
  const url: string = send.mock.calls[call][0].variables.ratingUrl;
  return url.slice(url.lastIndexOf('/') + 1);
}

async function surveyed(extra: Record<string, unknown> = {}) {
  const ticket = await customerTicket(extra);
  await sendCsatSurvey(ticket.toObject());
  return { ticket, token: sentToken() };
}

beforeEach(() => {
  send.mockResolvedValue(undefined);
});
afterEach(() => {
  jest.restoreAllMocks();
});

describe('sendCsatSurvey', () => {
  it('emails the customer a rating link and stores only the hash of its token', async () => {
    const { ticket, token } = await surveyed();

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        template: SUPPORT_CSAT_TEMPLATE,
        to: 'asha@acme.test',
        variables: {
          name: 'Asha Rao',
          ticketSubject: 'Invoice is wrong',
          reference: 'EXY-ABC123',
          ratingUrl: `https://status.exyconn.com/help/rate/${token}`,
        },
      }),
    );
    const saved = await SupportTicketModel.findById(ticket._id).lean();
    expect(saved?.csatSentAt).toBeInstanceOf(Date);
    expect(saved?.csatTokenHash).toMatch(/^[a-f\d]{64}$/);
    expect(saved?.csatTokenHash).not.toBe(token);
  });

  it('greets the customer by address when no name was given and sends no reference it lacks', async () => {
    const ticket = await customerTicket({ requesterName: '' });
    await sendCsatSurvey({ ...ticket.toObject(), reference: null });

    expect(send.mock.calls[0][0].variables).toMatchObject({
      name: 'asha@acme.test',
      reference: '',
    });
  });

  it('sends one survey per ticket, even when it is resolved again or twice at once', async () => {
    const ticket = await customerTicket();
    const row = ticket.toObject();

    await Promise.all([sendCsatSurvey(row), sendCsatSurvey(row)]);
    await sendCsatSurvey((await SupportTicketModel.findById(ticket._id).lean())!);

    expect(send).toHaveBeenCalledTimes(1);
  });

  it('asks nobody who is not a customer with an address', async () => {
    const employee = await SupportTicketModel.create({
      employeeId: 'emp-1',
      requesterEmail: 'staff@exyconn.com',
      subject: 'VPN',
      description: 'Down.',
    });
    const whatsapp = await customerTicket({ requesterEmail: '', channel: 'WHATSAPP' });

    await sendCsatSurvey(employee.toObject());
    await sendCsatSurvey(whatsapp.toObject());
    await sendCsatSurvey({ ...whatsapp.toObject(), requesterEmail: null });

    expect(send).not.toHaveBeenCalled();
    expect((await SupportTicketModel.findById(employee._id).lean())?.csatSentAt).toBeNull();
  });

  it('keeps the claim and logs it when the email cannot be sent', async () => {
    send.mockRejectedValueOnce(new Error('SMTP down'));
    const error = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    const ticket = await customerTicket();

    await expect(sendCsatSurvey(ticket.toObject())).resolves.toBeUndefined();

    expect(error).toHaveBeenCalledWith(
      { err: expect.any(Error) },
      `CSAT survey for ticket ${String(ticket._id)} failed`,
    );
    expect((await SupportTicketModel.findById(ticket._id).lean())?.csatSentAt).toBeInstanceOf(Date);
  });
});

describe('supportCsatSurvey', () => {
  it('shows the ticket a link belongs to, unanswered, ignoring stray whitespace', async () => {
    const { token } = await surveyed();

    await expect(supportCsatSurvey(` ${token} `, '10.0.0.1')).resolves.toEqual({
      reference: 'EXY-ABC123',
      subject: 'Invoice is wrong',
      score: null,
      ratedAt: null,
    });
  });

  it('returns null for a forged link, without saying why', async () => {
    await surveyed();

    await expect(supportCsatSurvey('forged-token')).resolves.toBeNull();
    await expect(supportCsatSurvey('')).resolves.toBeNull();
  });

  it('finds a survey whichever company the ticket belongs to', async () => {
    const organizationId = new Types.ObjectId().toHexString();
    const ticket = await runForOrganization(organizationId, () => customerTicket());
    await runForOrganization(organizationId, () => sendCsatSurvey(ticket.toObject()));

    await expect(supportCsatSurvey(sentToken())).resolves.toMatchObject({
      reference: 'EXY-ABC123',
    });
  });

  it('refuses a connection that has opened too many links in the hour', async () => {
    const { token } = await surveyed();
    for (let i = 0; i < 30; i += 1) {
      await supportCsatSurvey(token, '10.0.0.9');
    }

    await expect(supportCsatSurvey(token, '10.0.0.9')).rejects.toThrow(/Too many attempts/);
    await expect(supportCsatSurvey(token, '10.0.0.10')).resolves.not.toBeNull();
  });
});

describe('submitSupportCsat', () => {
  it('records one answer with its trimmed comment and the survey then reads as answered', async () => {
    const { ticket, token } = await surveyed();

    await expect(submitSupportCsat(token, 4, '  Quick and clear.  ', '10.0.0.1')).resolves.toBe(
      true,
    );

    const saved = await SupportTicketModel.findById(ticket._id).lean();
    expect(saved).toMatchObject({ csatScore: 4, csatComment: 'Quick and clear.' });
    expect(saved?.csatRatedAt).toBeInstanceOf(Date);
    expect(await supportCsatSurvey(token)).toMatchObject({ score: 4, ratedAt: saved?.csatRatedAt });
  });

  it('refuses the same link a second time and keeps the first answer', async () => {
    const { ticket, token } = await surveyed();
    await submitSupportCsat(token, 5, '');

    await expect(submitSupportCsat(token, 1, 'Changed my mind')).rejects.toThrow(
      'This survey link does not work, or it has already been answered.',
    );
    expect((await SupportTicketModel.findById(ticket._id).lean())?.csatScore).toBe(5);
  });

  it('refuses a forged link', async () => {
    await surveyed();

    await expect(submitSupportCsat('not-a-real-token', 3, '')).rejects.toThrow(
      /does not work, or it has already been answered/,
    );
  });

  it.each([0, 6, 2.5, Number.NaN])('refuses a rating of %p', async (score) => {
    const { ticket, token } = await surveyed();

    await expect(submitSupportCsat(token, score, '')).rejects.toThrow(
      'Choose a rating from 1 to 5.',
    );
    expect((await SupportTicketModel.findById(ticket._id).lean())?.csatRatedAt).toBeNull();
  });

  it('accepts a comment of exactly 1000 characters and refuses a longer one', async () => {
    const { token } = await surveyed();

    await expect(submitSupportCsat(token, 3, 'x'.repeat(1001))).rejects.toThrow(
      'Keep the comment under 1000 characters.',
    );
    await expect(submitSupportCsat(token, 3, `${'x'.repeat(1000)}   `)).resolves.toBe(true);
  });

  it('refuses a connection over its hourly limit before reading anything', async () => {
    const { token } = await surveyed();
    for (let i = 0; i < 30; i += 1) {
      await supportCsatSurvey(token, '10.0.0.7');
    }

    await expect(submitSupportCsat(token, 5, '', '10.0.0.7')).rejects.toThrow(/Too many attempts/);
  });
});

describe('csatSummary', () => {
  const answered = (score: number, extra: Record<string, unknown> = {}) =>
    customerTicket({ csatSentAt: new Date(), csatScore: score, csatRatedAt: new Date(), ...extra });

  it('is empty until somebody answers', async () => {
    await customerTicket({ csatSentAt: new Date() });

    await expect(csatSummary()).resolves.toEqual({
      csatSent: 1,
      csatResponses: 0,
      csatAverage: null,
      csatPercent: null,
    });
  });

  it('averages the answers and counts 4 and 5 as satisfied', async () => {
    await answered(5);
    await answered(4);
    await answered(2);
    await customerTicket({ csatSentAt: new Date() });

    await expect(csatSummary()).resolves.toEqual({
      csatSent: 4,
      csatResponses: 3,
      csatAverage: 3.67,
      csatPercent: 66.7,
    });
  });

  it('reads only the tickets in the desk scope it is given', async () => {
    await answered(1, { category: 'IT' });
    await answered(5, { category: 'OTHER' });

    await expect(csatSummary({ category: 'IT' })).resolves.toMatchObject({
      csatSent: 1,
      csatAverage: 1,
      csatPercent: 0,
    });
  });

  it("never counts another company's answers", async () => {
    const mine = new Types.ObjectId().toHexString();
    const theirs = new Types.ObjectId().toHexString();
    await runForOrganization(mine, () => answered(5));
    await runForOrganization(theirs, () => answered(1));

    await expect(runForOrganization(mine, () => csatSummary())).resolves.toMatchObject({
      csatSent: 1,
      csatResponses: 1,
      csatAverage: 5,
    });
  });
});

describe('setSupportTicketStatus', () => {
  type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
  const setStatus = (supportResolvers.Mutation as unknown as Record<string, Resolver>)
    .setSupportTicketStatus;
  const asSupport: GraphQLContext = {
    user: {
      id: new Types.ObjectId().toHexString(),
      email: 'd@exyconn.com',
      roles: [ROLES.SUPPORT],
    },
  };
  /** The survey is fire-and-forget, so wait until it has had its turn. */
  const settle = () => new Promise((resolve) => setTimeout(resolve, 50));

  it('sends the survey on the first resolve only, not on a reopen or a later close', async () => {
    const ticket = await customerTicket();
    const id = ticket._id.toHexString();

    await setStatus(null, { id, status: 'IN_PROGRESS' }, asSupport);
    await settle();
    expect(send).not.toHaveBeenCalled();

    await setStatus(null, { id, status: 'RESOLVED' }, asSupport);
    await settle();
    await setStatus(null, { id, status: 'OPEN' }, asSupport);
    await setStatus(null, { id, status: 'CLOSED' }, asSupport);
    await settle();

    expect(send).toHaveBeenCalledTimes(1);
  });

  it('logs a survey that fails outright and still answers with the new status', async () => {
    const error = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    jest.spyOn(SupportTicketModel, 'updateOne').mockRejectedValueOnce(new Error('write failed'));
    const ticket = await customerTicket();
    const id = ticket._id.toHexString();

    await expect(setStatus(null, { id, status: 'RESOLVED' }, asSupport)).resolves.toMatchObject({
      status: 'RESOLVED',
    });
    await settle();

    expect(error).toHaveBeenCalledWith(
      { err: expect.any(Error) },
      `CSAT survey for ticket ${id} failed`,
    );
  });
});

describe('SupportTicket.csatComment', () => {
  it('reads a ticket saved before CSAT existed as having no comment', () => {
    expect(supportTicketFields.csatComment({} as never)).toBe('');
    expect(supportTicketFields.csatComment({ csatComment: 'Great' } as never)).toBe('Great');
  });
});
