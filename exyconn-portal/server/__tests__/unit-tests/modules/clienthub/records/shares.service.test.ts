import { sharesService } from '../../../../../src/modules/clienthub/records/shares.service';
import { shareOptions } from '../../../../../src/modules/clienthub/records/shares.sources';
import { emailer } from '../../../../../src/modules/email/email.service';
import { ContractModel } from '../../../../../src/modules/legal/legal.model';
import { LegalDocumentModel } from '../../../../../src/modules/legal/document.model';
import { PolicyModel } from '../../../../../src/modules/legal/policy.model';
import { ContractSignatureModel } from '../../../../../src/modules/legal/signature.model';
import { useTestOrganization } from '../../../../helpers';
import { codeOf } from '../../codeOf';
import { seedClient } from './fixtures';

useTestOrganization();
let acme: string;
let send: jest.SpyInstance;

const contract = (title: string) =>
  ContractModel.create({
    title,
    party: 'Acme',
    status: 'ACTIVE',
    effectiveDate: new Date('2026-01-01'),
    expiryDate: new Date('2027-01-01'),
    documentUrl: 'https://files.test/msa.pdf',
    content: '<p>Terms</p><script>alert(1)</script>',
  });

const policy = (slug: string, fields: Record<string, unknown>) =>
  PolicyModel.create({
    title: slug,
    slug,
    body: '<p>Body</p>',
    effectiveDate: new Date(),
    ...fields,
  });

beforeEach(async () => {
  send = jest.spyOn(emailer, 'send').mockResolvedValue(undefined);
  acme = await seedClient('Acme', 'dana@acme.test');
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('sharing Legal records with a client', () => {
  it('shows the contract live, with the counterparty’s latest signature', async () => {
    const msa = await contract('Acme MSA');
    const refId = msa._id.toHexString();
    await ContractSignatureModel.create({
      contractId: refId,
      tokenHash: 'hash-1',
      signerName: 'Dana',
      signerEmail: 'dana@acme.test',
      expiresAt: new Date(Date.now() + 86_400_000),
      signedAt: new Date('2026-02-01'),
      signedName: 'Dana Reyes',
    });

    const item = await sharesService.share(
      acme,
      { kind: 'CONTRACT', refId, note: 'Signed copy' },
      'Arjun',
    );
    await ContractModel.updateOne({ _id: refId }, { status: 'EXPIRED' });
    const [listed] = await sharesService.hubList(acme);

    expect(item).toMatchObject({ title: 'Acme MSA', note: 'Signed copy', sharedByName: 'Arjun' });
    expect(listed).toMatchObject({
      status: 'EXPIRED',
      fileUrl: 'https://files.test/msa.pdf',
      hasContent: true,
      signedBy: 'Dana Reyes',
    });
  });

  it('shares a record once: sharing again updates the note and never re-sends', async () => {
    const msa = await contract('Acme MSA');
    const input = { kind: 'CONTRACT' as const, refId: msa._id.toHexString(), notify: true };

    await sharesService.share(acme, input, 'Arjun');
    await sharesService.share(acme, { ...input, note: 'Updated' }, 'Arjun');

    const rows = await sharesService.staffList(acme);
    expect(rows).toHaveLength(1);
    expect(rows[0].note).toBe('Updated');
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('refuses a draft or HR-only policy and an archived document', async () => {
    const draft = await policy('draft-policy', { status: 'DRAFT' });
    const hrOnly = await policy('hr-policy', { status: 'PUBLISHED', audience: 'HR_ONLY' });
    const archived = await LegalDocumentModel.create({ title: 'Old', status: 'ARCHIVED' });

    const calls = [
      { kind: 'POLICY' as const, refId: draft._id.toHexString() },
      { kind: 'POLICY' as const, refId: hrOnly._id.toHexString() },
      { kind: 'DOCUMENT' as const, refId: archived._id.toHexString() },
    ];

    const codes = await Promise.all(
      calls.map((input) => codeOf(sharesService.share(acme, input, 'A'))),
    );

    expect(codes).toEqual(['BAD_USER_INPUT', 'BAD_USER_INPUT', 'BAD_USER_INPUT']);
  });

  it('hides a record deleted in Legal from the client, and marks it for staff', async () => {
    const msa = await contract('Gone');
    await sharesService.share(acme, { kind: 'CONTRACT', refId: msa._id.toHexString() }, 'A');
    await ContractModel.deleteOne({ _id: msa._id });

    expect(await sharesService.hubList(acme)).toEqual([]);
    expect((await sharesService.staffList(acme))[0].status).toBe('REMOVED');
  });

  it('hands the client sanitised text for their own share only', async () => {
    const msa = await contract('Acme MSA');
    const item = await sharesService.share(
      acme,
      { kind: 'CONTRACT', refId: msa._id.toHexString() },
      'A',
    );
    const globex = await seedClient('Globex', 'hank@globex.test');

    const html = await sharesService.hubContent(acme, item.id);

    expect(html).toContain('<p>Terms</p>');
    expect(html).not.toContain('<script>');
    expect(await codeOf(sharesService.hubContent(globex, item.id))).toBe('NOT_FOUND');
    expect(await codeOf(sharesService.hubContent(acme, 'not-an-id'))).toBe('NOT_FOUND');
  });

  it('offers only shareable records', async () => {
    await policy('privacy', { title: 'Privacy policy', status: 'PUBLISHED', audience: 'PUBLIC' });
    await policy('pay', { title: 'Pay policy', status: 'PUBLISHED', audience: 'HR_ONLY' });
    await LegalDocumentModel.create({ title: 'Privacy notice', status: 'FINAL' });

    await LegalDocumentModel.create({ title: 'Retired', status: 'ARCHIVED' });
    await contract('Acme MSA');

    const policies = await shareOptions('POLICY');
    const documents = await shareOptions('DOCUMENT');
    const contracts = await shareOptions('CONTRACT');

    expect(policies.map((row) => row.title)).toEqual(['Privacy policy']);
    expect(documents.map((row) => row.title)).toEqual(['Privacy notice']);
    expect(contracts.map((row) => row.title)).toEqual(['Acme MSA']);
  });

  it('removes a share, and says not found the second time', async () => {
    const msa = await contract('Acme MSA');
    const item = await sharesService.share(
      acme,
      { kind: 'CONTRACT', refId: msa._id.toHexString() },
      'A',
    );

    await sharesService.unshare(item.id);

    expect(await codeOf(sharesService.unshare(item.id))).toBe('NOT_FOUND');
  });
});
