import { Types } from 'mongoose';
import { signContractInternally } from '../../../../src/modules/legal/signature.service';
import { ContractModel } from '../../../../src/modules/legal/legal.model';
import { ContractSignatureModel } from '../../../../src/modules/legal/signature.model';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';

jest.mock('../../../../src/modules/email', () => ({
  emailer: { send: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock('../../../../src/utils/safeFetch', () => ({
  safeFetch: jest.fn(),
}));

import { safeFetch } from '../../../../src/utils/safeFetch';

const FROM = { ip: '198.51.100.7', userAgent: 'Mozilla/5.0' };
const LONG_AGENT = 'A'.repeat(260);
const missingId = () => String(new Types.ObjectId());

const contract = (overrides: Record<string, unknown> = {}) =>
  ContractModel.create({
    title: 'Helix SOW',
    party: 'Helix GmbH',
    type: 'SOW',
    effectiveDate: new Date('2026-09-01'),
    expiryDate: new Date('2027-09-01'),
    status: 'DRAFT',
    documentUrl: 'https://cdn.example.com/helix-sow.pdf',
    ...overrides,
  });

beforeEach(() => {
  (safeFetch as jest.Mock).mockResolvedValue({
    ok: true,
    arrayBuffer: () => Promise.resolve(new Uint8Array(Buffer.from('bytes')).buffer),
  });
});

useTestOrganization();

describe('signContractInternally', () => {
  it('is NOT_FOUND for a contract that does not exist', async () => {
    expect(
      await codeOf(
        signContractInternally({
          contractId: missingId(),
          signerEmail: 'dev@exyconn.com',
          ...FROM,
        }),
      ),
    ).toBe('NOT_FOUND');
  });

  it('refuses a contract with no document, without fetching anything', async () => {
    const row = await contract({ documentUrl: '' });

    expect(
      await codeOf(
        signContractInternally({
          contractId: String(row._id),
          signerEmail: 'dev@exyconn.com',
          ...FROM,
        }),
      ),
    ).toBe('BAD_USER_INPUT');
    expect(safeFetch).not.toHaveBeenCalled();
  });

  it('answers with the signed contract and a shortened user agent', async () => {
    const row = await contract();

    const signed = await signContractInternally({
      contractId: String(row._id),
      signerEmail: 'dev@exyconn.com',
      ip: FROM.ip,
      userAgent: LONG_AGENT,
    });

    expect(signed).toMatchObject({
      id: String(row._id),
      signedBy: 'dev@exyconn.com',
      status: 'ACTIVE',
    });
    const evidence = await ContractSignatureModel.findOne().lean();
    expect(evidence?.signedUserAgent).toHaveLength(200);
    expect(evidence?.expiresAt.getTime()).toBe(evidence?.signedAt?.getTime());
  });

  it('refuses rather than signing when the document cannot be read', async () => {
    const row = await contract();
    (safeFetch as jest.Mock).mockResolvedValueOnce({ ok: false });

    expect(
      await codeOf(
        signContractInternally({
          contractId: String(row._id),
          signerEmail: 'dev@exyconn.com',
          ...FROM,
        }),
      ),
    ).toBe('BAD_USER_INPUT');
    expect(await ContractSignatureModel.countDocuments()).toBe(0);
  });
});
