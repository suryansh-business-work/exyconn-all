import { Types } from 'mongoose';
import { legalResolvers } from '../../../../src/modules/legal';
import { ROLES } from '../../../../src/constants/roles';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';
import type { GraphQLContext } from '../../../../src/middleware/auth';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const L = { ...legalResolvers.Query, ...legalResolvers.Mutation } as unknown as Record<
  string,
  Resolver
>;

const legal = (): GraphQLContext => ({
  user: { id: new Types.ObjectId().toHexString(), roles: [ROLES.LEGAL], email: 'dev@exyconn.com' },
});
const employee: GraphQLContext = {
  user: { id: new Types.ObjectId().toHexString(), roles: [ROLES.EMPLOYEE], email: 'e@exyconn.com' },
};

useTestOrganization();

describe('the merged legal resolver map', () => {
  it('reads an older contract with no document as an empty URL', () => {
    const { documentUrl } = legalResolvers.Contract;

    expect(documentUrl({})).toBe('');
    expect(documentUrl({ documentUrl: null })).toBe('');
    expect(documentUrl({ documentUrl: 'https://cdn.example.com/a.pdf' })).toBe(
      'https://cdn.example.com/a.pdf',
    );
  });

  it('serves contract CRUD, document CRUD and the signature operations together', async () => {
    const created = (await L.createContract(
      null,
      {
        input: {
          title: 'Atlas MSA',
          party: 'Atlas',
          type: 'MSA',
          effectiveDate: new Date('2026-01-01'),
          expiryDate: new Date('2027-01-01'),
          status: 'DRAFT',
        },
      },
      legal(),
    )) as { id: string; title: string };
    await L.createLegalDocument(
      null,
      { input: { title: 'Retention schedule', category: 'POLICY', status: 'DRAFT' } },
      legal(),
    );

    expect(created.title).toBe('Atlas MSA');
    const documents = (await L.listLegalDocuments(null, {}, legal())) as Array<{ title: string }>;
    expect(documents.map((row) => row.title)).toEqual(['Retention schedule']);
    await expect(L.contractSignatures(null, { contractId: created.id }, legal())).resolves.toEqual(
      [],
    );
  });

  it('keeps contract CRUD to Legal', async () => {
    expect(await codeOf(L.listContracts(null, {}, employee))).toBe('FORBIDDEN');
  });
});
