import { Types } from 'mongoose';
import {
  contractSignatures,
  contractToSign,
  requestContractSignature,
  revokeContractSignature,
  signContractWithToken,
  signingUrl,
} from '../../../../src/modules/legal/signature.service';
import { ContractModel } from '../../../../src/modules/legal/legal.model';
import { ContractSignatureModel } from '../../../../src/modules/legal/signature.model';
import { env } from '../../../../src/config/env';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';

jest.mock('../../../../src/modules/email', () => ({
  emailer: { send: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock('../../../../src/utils/safeFetch', () => ({
  safeFetch: jest.fn(),
}));

import { emailer } from '../../../../src/modules/email';
import { safeFetch } from '../../../../src/utils/safeFetch';

const mailed = emailer.send as jest.Mock;
const FROM = { ip: '198.51.100.7', userAgent: 'Mozilla/5.0' };
const LONG_AGENT = 'A'.repeat(260);
const missingId = () => new Types.ObjectId().toHexString();

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

const ask = (contractId: string, message?: string | null) =>
  requestContractSignature({
    contractId,
    signerName: '  Lena Vogt  ',
    signerEmail: '  Lena@Helix.Example ',
    requestedByName: 'dev@exyconn.com',
    message,
  });

beforeEach(() => {
  (safeFetch as jest.Mock).mockResolvedValue({
    ok: true,
    arrayBuffer: () => Promise.resolve(new Uint8Array(Buffer.from('bytes')).buffer),
  });
});

useTestOrganization();

describe('signingUrl', () => {
  it('points at the status site and escapes the token', () => {
    expect(signingUrl('a/b c')).toBe(`${env.projectShareBaseUrl}/sign/a%2Fb%20c`);
  });
});

describe('requestContractSignature', () => {
  it('is NOT_FOUND for a contract that does not exist', async () => {
    expect(await codeOf(ask(missingId()))).toBe('NOT_FOUND');
    expect(mailed).not.toHaveBeenCalled();
  });

  it('tidies the signer, stamps the contract as sent and writes a default message', async () => {
    const row = await contract();

    await ask(row._id.toHexString());

    const stored = await ContractSignatureModel.findOne().lean();
    expect(stored).toMatchObject({ signerName: 'Lena Vogt', signerEmail: 'lena@helix.example' });
    expect(stored?.expiresAt.getTime()).toBeGreaterThan(Date.now() + 29 * 86_400_000);
    expect((await ContractModel.findById(row._id).lean())?.sentAt).toBeInstanceOf(Date);
    const { variables, triggeredBy } = mailed.mock.calls[0][0];
    expect(variables.message).toBe(
      'Please read and sign "Helix SOW". The link below is yours alone and works for 30 days.',
    );
    expect(variables).toMatchObject({ party: 'Helix GmbH', contractTitle: 'Helix SOW' });
    expect(triggeredBy).toBe('dev@exyconn.com');
  });

  it('sends Legal’s own message when one is given', async () => {
    const row = await contract();

    await ask(row._id.toHexString(), 'Countersigned copy attached.');

    expect(mailed.mock.calls[0][0].variables.message).toBe('Countersigned copy attached.');
  });
});

describe('contractToSign', () => {
  it('shows nothing once the contract behind a live link is gone', async () => {
    const row = await contract();
    const { token } = await ask(row._id.toHexString());
    await ContractModel.deleteOne({ _id: row._id });

    await expect(contractToSign(token)).resolves.toBeNull();
  });
});

describe('signContractWithToken', () => {
  it('is NOT_FOUND when the contract was deleted after the link went out', async () => {
    const row = await contract();
    const { token } = await ask(row._id.toHexString());
    await ContractModel.deleteOne({ _id: row._id });

    expect(await codeOf(signContractWithToken({ token, signedName: 'Lena Vogt', ...FROM }))).toBe(
      'NOT_FOUND',
    );
  });

  it('keeps at most 200 characters of the user agent', async () => {
    const row = await contract();
    const { token } = await ask(row._id.toHexString());

    await signContractWithToken({
      token,
      signedName: 'Lena Vogt',
      ip: FROM.ip,
      userAgent: LONG_AGENT,
    });

    const evidence = await ContractSignatureModel.findOne().lean();
    expect(evidence?.signedUserAgent).toHaveLength(200);
  });

  it('refuses an unknown link as no longer valid', async () => {
    expect(
      await codeOf(signContractWithToken({ token: 'nope', signedName: 'Lena Vogt', ...FROM })),
    ).toBe('BAD_USER_INPUT');
  });
});

describe('contractSignatures and revokeContractSignature', () => {
  it('lists only the asked contract’s requests, with their evidence fields', async () => {
    const mine = await contract();
    const other = await contract({ title: 'Other' });
    await ask(mine._id.toHexString());
    await ask(other._id.toHexString());

    const rows = await contractSignatures(mine._id.toHexString());

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      signerName: 'Lena Vogt',
      signerEmail: 'lena@helix.example',
      requestedByName: 'dev@exyconn.com',
      revokedAt: null,
      signedAt: null,
      documentSha256: '',
    });
    expect(typeof rows[0].id).toBe('string');
  });

  it('is NOT_FOUND when withdrawing a request that does not exist', async () => {
    expect(await codeOf(revokeContractSignature(missingId()))).toBe('NOT_FOUND');
  });
});
