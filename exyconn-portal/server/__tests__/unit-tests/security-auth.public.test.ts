import { websiteResolvers } from '../../src/modules/website';
import { WebsiteSubmissionModel } from '../../src/modules/website/models';
import { SUBMISSION_BURST_POINTS } from '../../src/modules/website/website.submissions.resolvers';
import { ClientModel } from '../../src/modules/clients/clients.model';
import { SupportTicketModel } from '../../src/modules/employee/support.model';
import { createClientSupportTicket } from '../../src/modules/support/client-ticket.service';
import type { GraphQLContext } from '../../src/middleware/auth';
import { useTestOrganization } from '../helpers';

jest.mock('../../src/utils/mailer', () => ({
  mailer: { sendFormSubmissionEmail: jest.fn().mockResolvedValue(undefined) },
}));

const visitor = (ip: string): GraphQLContext => ({ user: null, ip });

const submit = (submissionData: Record<string, unknown>, ip = '198.51.100.40') =>
  websiteResolvers.Mutation.createWebsiteSubmission(
    null,
    { input: { formType: 'contact', submissionData } },
    visitor(ip),
  );

describe('the public website submission', () => {
  it('refuses a payload no website form could send', async () => {
    await expect(submit({ message: 'x'.repeat(17 * 1024) })).rejects.toThrow(/too large/);
    const wide = Object.fromEntries(Array.from({ length: 51 }, (_v, i) => [`f${i}`, 'x']));
    await expect(submit(wide)).rejects.toThrow(/too many fields/);
    await expect(submit({ a: { b: { c: 'deep' } } })).rejects.toThrow(/nested too deeply/);
    expect(await WebsiteSubmissionModel.countDocuments()).toBe(0);
  });

  it('accepts one level of nesting, as a form with a list does', async () => {
    await expect(submit({ email: 'a@b.co', skills: ['ts', 'go'] })).resolves.toHaveProperty('id');
  });

  it('allows a burst from one IP, then refuses with TOO_MANY_REQUESTS', async () => {
    for (let index = 0; index < SUBMISSION_BURST_POINTS; index += 1) {
      await submit({ message: `hello ${index}` }, '203.0.113.40');
    }

    await expect(submit({ message: 'one more' }, '203.0.113.40')).rejects.toMatchObject({
      extensions: expect.objectContaining({ code: 'TOO_MANY_REQUESTS' }),
    });
    await expect(submit({ message: 'elsewhere' }, '203.0.113.41')).resolves.toHaveProperty('id');
  });
});

describe('matching a customer ticket to a client by domain', () => {
  useTestOrganization();

  it('treats the domain literally, so a pattern cannot match every client', async () => {
    await ClientModel.create({
      name: 'Acme',
      company: 'Acme',
      phone: '+1 555 0100',
      email: 'boss@xacme.io',
    });

    // Unescaped, "@x.*io$" would match boss@xacme.io and hand Mallory the Acme account.
    await createClientSupportTicket({
      requesterName: 'Mallory',
      requesterEmail: 'mallory@x.*io',
      subject: 'Please help me',
      category: 'OTHER',
      description: 'This is a long enough description.',
      priority: 'HIGH',
    });

    const ticket = await SupportTicketModel.findOne({ requesterEmail: 'mallory@x.*io' }).lean();
    expect(ticket?.clientId).toBe('');
  });
});
