import { Types } from 'mongoose';
import type { runAssistJob } from '../../../../../src/modules/ai/ai.actions';
import { CompanyModel } from '../../../../../src/modules/crm/company.model';
import type { Role } from '../../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../../src/middleware/auth';

/** A signed-in person of the company with these roles; a fresh id each time (own AI cap). */
export const ctxAs = (organizationId: string, roles: Role[]): GraphQLContext => ({
  user: {
    id: new Types.ObjectId().toHexString(),
    email: 'asha@exyconn.com',
    roles,
    organizationId,
  },
  organizationId,
});

/** What the AI run answers: its text and what it cost. */
export const answer = (response: string, costUsd = 0.01) =>
  ({ response, costUsd }) as unknown as Awaited<ReturnType<typeof runAssistJob>>;

const BODY = 'Hi Acme team,\n\nShort note.\n\nAsha';

/** An answer in the asked-for JSON with one version per subject. */
export const versions = (subjects: string[], costUsd = 0.01) =>
  answer(
    JSON.stringify({ versions: subjects.map((subject) => ({ subject, body: BODY })) }),
    costUsd,
  );

/** An answer with a single version. */
export const email = (subject: string, body = BODY) =>
  answer(JSON.stringify({ versions: [{ subject, body }] }));

export const seedAcme = () =>
  CompanyModel.create({
    name: 'Acme',
    domain: 'acme.com',
    website: 'https://www.acme.com',
    industry: 'Retail',
    city: 'Pune',
    country: 'India',
    description: 'Chain of grocery stores.',
    emails: [{ address: 'hello@acme.com', primary: true }],
  });
