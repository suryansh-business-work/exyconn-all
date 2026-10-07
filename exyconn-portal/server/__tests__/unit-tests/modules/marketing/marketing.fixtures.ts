import { CampaignModel } from '../../../../src/modules/marketing/marketing.model';
import { ClientModel } from '../../../../src/modules/clients/clients.model';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';

/** A signed-in marketer, the role every campaign resolver asks for. */
export const asMarketing: GraphQLContext = {
  user: { id: 'user-1', roles: [ROLES.MARKETING], email: 'growth@exyconn.com' },
};

/** A signed-in salesperson: allowed the attribution reads, refused everything else. */
export const asCrm: GraphQLContext = {
  user: { id: 'user-2', roles: [ROLES.CRM], email: 'sales@exyconn.com' },
};

/** A signed-in employee with no marketing or sales role. */
export const asEmployee: GraphQLContext = {
  user: { id: 'user-3', roles: [ROLES.EMPLOYEE], email: 'staff@exyconn.com' },
};

/** An email campaign with sendable copy; `over` replaces any field. */
export const seedCampaign = (over: Record<string, unknown> = {}) =>
  CampaignModel.create({
    name: 'Spring newsletter',
    channel: 'EMAIL',
    budget: 100,
    startDate: new Date('2027-03-01'),
    endDate: new Date('2027-03-31'),
    status: 'ACTIVE',
    subject: 'Hello {{name}}',
    body: 'Dear {{name}} of {{company}}',
    ...over,
  });

export const seedClient = (name: string, email: string) =>
  ClientModel.create({ name, email, phone: '000', company: 'Acme', status: 'ACTIVE' });

/**
 * Re-reads `read` until `done` accepts its value. The tracking routes answer first and record
 * afterwards, so a test has to wait for the write it is checking for rather than race it.
 */
export async function eventually<T>(read: () => Promise<T>, done: (value: T) => boolean) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const value = await read();
    if (done(value)) {
      return value;
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  return read();
}

/** Lets fire-and-forget work started by a request finish before asserting it did nothing. */
export const settle = () => new Promise((resolve) => setTimeout(resolve, 150));
