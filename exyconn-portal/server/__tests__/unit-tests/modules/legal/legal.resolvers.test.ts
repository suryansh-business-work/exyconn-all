import { Types } from 'mongoose';
import { legalCustomResolvers } from '../../../../src/modules/legal/legal.resolvers';
import { ContractModel } from '../../../../src/modules/legal/legal.model';
import { ContractSignatureModel } from '../../../../src/modules/legal/signature.model';
import { ROLES } from '../../../../src/constants/roles';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';
import type { GraphQLContext } from '../../../../src/middleware/auth';

jest.mock('../../../../src/modules/email', () => ({
  emailer: { send: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock('../../../../src/utils/safeFetch', () => ({
  safeFetch: jest.fn(),
}));

import { safeFetch } from '../../../../src/utils/safeFetch';

const legal = (extra: Partial<GraphQLContext> = {}): GraphQLContext => ({
  user: { id: String(new Types.ObjectId()), roles: [ROLES.LEGAL], email: 'dev@exyconn.com' },
  ...extra,
});
const employee: GraphQLContext = {
  user: { id: String(new Types.ObjectId()), roles: [ROLES.EMPLOYEE], email: 'e@exyconn.com' },
};
const anonymous: GraphQLContext = { user: null };

const DOCUMENT = Buffer.from('%PDF-1.7 signed bytes');

const contract = (overrides: Record<string, unknown> = {}) =>
  ContractModel.create({
    title: 'Orbit NDA',
    party: 'Orbit Inc',
    type: 'NDA',
    effectiveDate: new Date('2026-09-01'),
    expiryDate: new Date('2027-09-01'),
    status: 'DRAFT',
    documentUrl: 'https://cdn.example.com/orbit-nda.pdf',
    ...overrides,
  });

/** Asks Ola to sign a fresh contract, as Legal. */
const askOla = async () => {
  const row = await contract();
  return legalCustomResolvers.Mutation.requestContractSignature(
    null,
    { contractId: String(row._id), signerName: 'Ola Berg', signerEmail: 'ola@orbit.example' },
    legal(),
  );
};

beforeEach(() => {
  (safeFetch as jest.Mock).mockResolvedValue({
    ok: true,
    arrayBuffer: () => Promise.resolve(new Uint8Array(DOCUMENT).buffer),
  });
});

useTestOrganization();

describe('the signature resolvers', () => {
  it('refuses the Legal-only operations to anybody not in Legal', async () => {
    const { Query, Mutation } = legalCustomResolvers;

    /** The guard throws before any promise exists, so the call is wrapped to settle. */
    const settle = (call: () => unknown) => codeOf((async () => call())());

    expect(await settle(() => Query.contractSignatures(null, { contractId: 'x' }, anonymous))).toBe(
      'UNAUTHENTICATED',
    );
    expect(await settle(() => Mutation.revokeContractSignature(null, { id: 'x' }, employee))).toBe(
      'FORBIDDEN',
    );
    expect(await settle(() => Mutation.signContract(null, { id: 'x' }, employee))).toBe(
      'FORBIDDEN',
    );
  });

  it('names the asking account as the requester, not an argument', async () => {
    const request = await askOla();

    const stored = await ContractSignatureModel.findById(request.id).lean();
    expect(stored?.requestedByName).toBe('dev@exyconn.com');
    await expect(
      legalCustomResolvers.Query.contractToSign(null, { token: request.token }),
    ).resolves.toMatchObject({ title: 'Orbit NDA', signerName: 'Ola Berg' });
  });

  it('withdraws a request through the resolver', async () => {
    const request = await askOla();

    await expect(
      legalCustomResolvers.Mutation.revokeContractSignature(null, { id: request.id }, legal()),
    ).resolves.toBe(true);
    await expect(
      legalCustomResolvers.Query.contractToSign(null, { token: request.token }),
    ).resolves.toBeNull();
  });

  it('signs our side as the account, with "unknown" when the request carries no address', async () => {
    const row = await contract();

    const signed = await legalCustomResolvers.Mutation.signContract(
      null,
      { id: String(row._id) },
      legal(),
    );

    expect(signed).toMatchObject({ signedBy: 'dev@exyconn.com', status: 'ACTIVE' });
    const evidence = await ContractSignatureModel.findOne().lean();
    expect(evidence).toMatchObject({ signedIp: 'unknown', signedUserAgent: '' });
  });

  it('takes our side’s address and agent from the request when it has them', async () => {
    const row = await contract();

    await legalCustomResolvers.Mutation.signContract(
      null,
      { id: String(row._id) },
      legal({ ip: '203.0.113.4', userAgent: 'Firefox/140' }),
    );

    const evidence = await ContractSignatureModel.findOne().lean();
    expect(evidence).toMatchObject({ signedIp: '203.0.113.4', signedUserAgent: 'Firefox/140' });
  });

  it('records the counterparty’s address from the request, never from arguments', async () => {
    const { token } = await askOla();

    await legalCustomResolvers.Mutation.signContractWithToken(
      null,
      { token, signedName: 'Ola Berg' },
      anonymous,
    );
    const first = await ContractSignatureModel.findOne({ signedName: 'Ola Berg' }).lean();
    expect(first).toMatchObject({ signedIp: 'unknown', signedUserAgent: '' });
  });

  it('keeps the counterparty’s real address when the request has one', async () => {
    const { token } = await askOla();

    await legalCustomResolvers.Mutation.signContractWithToken(
      null,
      { token, signedName: 'Ola Berg' },
      { user: null, ip: '198.51.100.20', userAgent: 'Safari/18' },
    );

    const evidence = await ContractSignatureModel.findOne().lean();
    expect(evidence).toMatchObject({ signedIp: '198.51.100.20', signedUserAgent: 'Safari/18' });
  });
});
