import { createHash } from 'node:crypto';
import {
  contractSignatures,
  contractToSign,
  requestContractSignature,
  revokeContractSignature,
  signContractInternally,
  signContractWithToken,
} from '../../src/modules/legal/signature.service';
import { ContractModel } from '../../src/modules/legal/legal.model';
import { ContractSignatureModel } from '../../src/modules/legal/signature.model';
import { useTestOrganization } from '../helpers';

jest.mock('../../src/modules/email', () => ({
  emailer: { send: jest.fn().mockResolvedValue(undefined) },
}));

// The document is fetched so its bytes can be hashed; the network is not part of the test.
const DOCUMENT = Buffer.from('%PDF-1.7 the agreement');
const DOCUMENT_SHA = createHash('sha256').update(DOCUMENT).digest('hex');
jest.mock('../../src/utils/safeFetch', () => ({
  safeFetch: jest.fn(),
}));

import { emailer } from '../../src/modules/email';
import { safeFetch } from '../../src/utils/safeFetch';

const fetched = safeFetch as jest.Mock;
const mailed = emailer.send as jest.Mock;

/**
 * A response shaped the way the service reads it.
 *
 * The bytes are copied into their own ArrayBuffer: `Buffer.from` hands back a view into a
 * pooled buffer, so passing `.buffer` straight through would hash whatever else happened to
 * be in the pool.
 */
const documentResponse = (bytes = DOCUMENT, ok = true) => ({
  ok,
  arrayBuffer: () => Promise.resolve(new Uint8Array(bytes).buffer),
});

const FROM = { ip: '198.51.100.7', userAgent: 'Mozilla/5.0 (Macintosh) Chrome/141' };

const contract = (overrides: Record<string, unknown> = {}) =>
  ContractModel.create({
    title: 'Nimbus MSA',
    party: 'Nimbus Ltd',
    type: 'MSA',
    effectiveDate: new Date('2026-09-01'),
    expiryDate: new Date('2027-09-01'),
    status: 'DRAFT',
    documentUrl: 'https://cdn.example.com/nimbus-msa.pdf',
    ...overrides,
  });

const ask = async (contractId: string) =>
  requestContractSignature({
    contractId,
    signerName: 'Sam Khan',
    signerEmail: 'sam@nimbus.example',
    requestedByName: 'dev@exyconn.com',
  });

beforeEach(() => {
  fetched.mockResolvedValue(documentResponse());
});

describe('asking a counterparty to sign', () => {
  useTestOrganization();

  it('refuses when there is nothing to sign', async () => {
    const row = await contract({ documentUrl: '' });

    await expect(ask(String(row._id))).rejects.toThrow('Attach the document');
  });

  it('emails a link and hands the same link back', async () => {
    const row = await contract();

    const request = await ask(String(row._id));

    expect(request.url).toContain(`/sign/${encodeURIComponent(request.token)}`);
    expect(mailed).toHaveBeenCalledWith(
      expect.objectContaining({
        template: 'contract-for-signature',
        to: 'sam@nimbus.example',
        variables: expect.objectContaining({ signingUrl: request.url }),
      }),
    );
  });

  it('stores only the hash of the token', async () => {
    const row = await contract();

    const request = await ask(String(row._id));
    const stored = await ContractSignatureModel.findOne().lean();

    expect(stored?.tokenHash).toBe(createHash('sha256').update(request.token).digest('hex'));
    expect(JSON.stringify(stored)).not.toContain(request.token);
  });
});

describe('what the counterparty is shown', () => {
  useTestOrganization();

  it('shows the contract and the document, and nothing about us', async () => {
    const row = await contract();
    const { token } = await ask(String(row._id));

    const shown = await contractToSign(token);

    expect(shown).toMatchObject({
      title: 'Nimbus MSA',
      party: 'Nimbus Ltd',
      documentUrl: 'https://cdn.example.com/nimbus-msa.pdf',
      signerName: 'Sam Khan',
      signedAt: null,
    });
    expect(Object.keys(shown ?? {})).not.toContain('status');
  });

  it('shows nothing for a link that is unknown, withdrawn or expired', async () => {
    const row = await contract();
    const withdrawn = await ask(String(row._id));
    const expired = await ask(String(row._id));
    await revokeContractSignature(withdrawn.id);
    await ContractSignatureModel.updateOne(
      { _id: expired.id },
      { expiresAt: new Date(Date.now() - 1000) },
    );

    expect(await contractToSign('not-a-token')).toBeNull();
    expect(await contractToSign(withdrawn.token)).toBeNull();
    expect(await contractToSign(expired.token)).toBeNull();
  });
});

describe('signing', () => {
  useTestOrganization();

  it('records the name, the address and the hash of the document', async () => {
    const row = await contract();
    const { token } = await ask(String(row._id));

    const receipt = await signContractWithToken({ token, signedName: ' Sam Khan ', ...FROM });

    expect(receipt.documentSha256).toBe(DOCUMENT_SHA);
    const evidence = await ContractSignatureModel.findOne().lean();
    expect(evidence).toMatchObject({
      signedName: 'Sam Khan',
      signedIp: FROM.ip,
      signedUserAgent: FROM.userAgent,
      documentSha256: DOCUMENT_SHA,
      documentUrl: 'https://cdn.example.com/nimbus-msa.pdf',
    });
  });

  it('makes the contract active and names the signer', async () => {
    const row = await contract();
    const { token } = await ask(String(row._id));

    await signContractWithToken({ token, signedName: 'Sam Khan', ...FROM });
    const signed = await ContractModel.findById(row._id).lean();

    expect(signed).toMatchObject({ status: 'ACTIVE', signedBy: 'Sam Khan' });
    expect(signed?.signedAt).toBeInstanceOf(Date);
  });

  it('will not sign the same request twice', async () => {
    const row = await contract();
    const { token } = await ask(String(row._id));
    await signContractWithToken({ token, signedName: 'Sam Khan', ...FROM });

    await expect(signContractWithToken({ token, signedName: 'Sam Khan', ...FROM })).rejects.toThrow(
      'already been signed',
    );
  });

  it('refuses a name too short to be one', async () => {
    const row = await contract();
    const { token } = await ask(String(row._id));

    await expect(signContractWithToken({ token, signedName: 'S', ...FROM })).rejects.toThrow(
      'Type your full name',
    );
  });

  it('refuses rather than recording an empty hash when the document cannot be read', async () => {
    const row = await contract();
    const { token } = await ask(String(row._id));
    fetched.mockResolvedValueOnce(documentResponse(DOCUMENT, false));

    await expect(signContractWithToken({ token, signedName: 'Sam Khan', ...FROM })).rejects.toThrow(
      'could not be read',
    );
    expect(await ContractSignatureModel.findOne().lean()).toMatchObject({ signedAt: null });
  });

  it('records our own side against the account that signed it', async () => {
    const row = await contract();

    await signContractInternally({
      contractId: String(row._id),
      signerEmail: 'dev@exyconn.com',
      ...FROM,
    });

    const [evidence] = await contractSignatures(String(row._id));
    expect(evidence).toMatchObject({
      signedName: 'dev@exyconn.com',
      signedIp: FROM.ip,
      documentSha256: DOCUMENT_SHA,
    });
    expect(await ContractModel.findById(row._id).lean()).toMatchObject({ status: 'ACTIVE' });
  });
});

describe('withdrawing a request', () => {
  useTestOrganization();

  it('stops an unsigned link working', async () => {
    const row = await contract();
    const { id, token } = await ask(String(row._id));

    await revokeContractSignature(id);

    expect(await contractToSign(token)).toBeNull();
    await expect(signContractWithToken({ token, signedName: 'Sam Khan', ...FROM })).rejects.toThrow(
      'no longer valid',
    );
  });

  it('refuses to withdraw a signature that has been given', async () => {
    const row = await contract();
    const { id, token } = await ask(String(row._id));
    await signContractWithToken({ token, signedName: 'Sam Khan', ...FROM });

    await expect(revokeContractSignature(id)).rejects.toThrow('already been signed');
  });
});
