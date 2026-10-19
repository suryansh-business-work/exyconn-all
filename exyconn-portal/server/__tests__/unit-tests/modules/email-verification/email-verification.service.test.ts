import {
  EmailVerificationBatchModel,
  EmailVerificationModel,
} from '../../../../src/modules/email-verification/email-verification.model';
import { EmailVerifierConfigModel } from '../../../../src/modules/email-verification/email-verifier-config.model';
import {
  MAX_BATCH_EMAILS,
  createBatch,
  listBatches,
  listVerifications,
  runBatchPass,
  verificationsFor,
  verifyEmail,
} from '../../../../src/modules/email-verification/email-verification.service';
import { logger } from '../../../../src/utils/logger';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';
import { fakeReacher } from './fakeReacher';

useTestOrganization();

const PASSWORD = process.env.TEST_PROXY_PASSWORD ?? 'proxy-pass-for-tests';
const SINGLE = { source: 'SINGLE' as const, checkedBy: 'Ravi' };
const RISKY = { is_reachable: 'risky', smtp: { is_catch_all: true, is_deliverable: true } };

afterEach(() => {
  jest.restoreAllMocks();
});

describe('verifyEmail', () => {
  it('checks the trimmed, lower-cased address and keeps the result', async () => {
    const calls = fakeReacher();

    const stored = await verifyEmail('  Asha@Acme.TEST ', SINGLE);

    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ to_email: 'asha@acme.test' });
    expect(calls[0]).not.toHaveProperty('proxy');
    expect(stored).toMatchObject({
      email: 'asha@acme.test',
      status: 'VERIFIED',
      deliverable: true,
      source: 'SINGLE',
      checkedBy: 'Ravi',
      batchId: '',
    });
  });

  it('checking again replaces the earlier result', async () => {
    fakeReacher({ 'asha@acme.test': RISKY });
    await verifyEmail('asha@acme.test', SINGLE);
    jest.restoreAllMocks();
    fakeReacher();

    await verifyEmail('asha@acme.test', { source: 'CRM', checkedBy: 'Meera' });

    const rows = await EmailVerificationModel.find().lean();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ status: 'VERIFIED', source: 'CRM', checkedBy: 'Meera' });
  });

  it('goes through the active proxy, with its sign-in when one is set', async () => {
    await EmailVerifierConfigModel.create({
      label: 'Idle',
      proxyHost: 'idle.example.test',
      isActive: false,
    });
    await EmailVerifierConfigModel.create({
      label: 'Main',
      proxyHost: 'proxy.example.test',
      proxyPort: 1085,
      proxyUsername: 'ravi',
      proxyPassword: PASSWORD,
      isActive: true,
    });
    const calls = fakeReacher();

    await verifyEmail('asha@acme.test', SINGLE);

    expect(calls[0].proxy).toEqual({
      host: 'proxy.example.test',
      port: 1085,
      username: 'ravi',
      password: PASSWORD,
    });
  });

  it('sends an open proxy without credentials, and none when the active config has no host', async () => {
    const config = await EmailVerifierConfigModel.create({
      label: 'Open',
      proxyHost: 'proxy.example.test',
      isActive: true,
    });
    const calls = fakeReacher();

    await verifyEmail('asha@acme.test', SINGLE);
    await EmailVerifierConfigModel.updateOne({ _id: config._id }, { proxyHost: '' });
    await verifyEmail('ben@acme.test', SINGLE);

    expect(calls[0].proxy).toEqual({ host: 'proxy.example.test', port: 1080 });
    expect(calls[1]).not.toHaveProperty('proxy');
  });

  it('stores something that is not an email address as invalid without asking Reacher', async () => {
    const calls = fakeReacher();

    const stored = await verifyEmail('not-an-address', SINGLE);

    expect(calls).toHaveLength(0);
    expect(stored).toMatchObject({
      email: 'not-an-address',
      status: 'INVALID',
      reason: 'Not a valid email address',
      syntaxValid: false,
    });
  });

  it('says the verifier is unavailable, and stores nothing, when Reacher cannot be reached', async () => {
    fakeReacher({ 'asha@acme.test': 'down' });
    const warned = jest.spyOn(logger, 'warn').mockImplementation(() => logger);

    await expect(codeOf(verifyEmail('asha@acme.test', SINGLE))).resolves.toBe('BAD_USER_INPUT');

    expect(warned).toHaveBeenCalledWith(expect.anything(), 'Email verifier unreachable');
    expect(await EmailVerificationModel.countDocuments()).toBe(0);
  });
});

describe('stored results', () => {
  it('finds the results of the addresses asked for, by their stored form', async () => {
    fakeReacher({ 'ben@acme.test': RISKY });
    await verifyEmail('asha@acme.test', SINGLE);
    await verifyEmail('ben@acme.test', SINGLE);

    const found = await verificationsFor(['ASHA@acme.test', ' ben@acme.test', 'new@acme.test']);

    expect([...found.keys()].sort((a, b) => a.localeCompare(b))).toEqual([
      'asha@acme.test',
      'ben@acme.test',
    ]);
    expect(found.get('ben@acme.test')?.status).toBe('RISKY');
  });

  it('answers an empty list, or only blanks, without a lookup', async () => {
    const find = jest.spyOn(EmailVerificationModel, 'find');

    expect((await verificationsFor([])).size).toBe(0);
    expect((await verificationsFor(['  '])).size).toBe(0);
    expect(find).not.toHaveBeenCalled();
  });

  it('pages the records newest check first', async () => {
    fakeReacher();
    await verifyEmail('asha@acme.test', SINGLE);
    await new Promise((resolve) => setTimeout(resolve, 5));
    await verifyEmail('ben@acme.test', SINGLE);

    const page = await listVerifications({ page: 0, pageSize: 1 });

    expect(page.totalCount).toBe(2);
    expect(page.rows).toEqual([expect.objectContaining({ email: 'ben@acme.test' })]);
  });
});

describe('bulk checks', () => {
  it('queues each distinct address once, in its stored form', async () => {
    const batch = await createBatch(
      'October leads',
      ['Asha@acme.test', 'asha@acme.test ', '', 'ben@acme.test'],
      'Ravi',
    );

    expect(batch).toMatchObject({
      name: 'October leads',
      emails: ['asha@acme.test', 'ben@acme.test'],
      status: 'QUEUED',
      processed: 0,
      createdBy: 'Ravi',
    });
  });

  it('refuses a file with no addresses, and one over the limit', async () => {
    await expect(codeOf(createBatch('Empty', [' ', ''], 'Ravi'))).resolves.toBe('BAD_USER_INPUT');
    const tooMany = Array.from({ length: MAX_BATCH_EMAILS + 1 }, (_, at) => `p${at}@acme.test`);
    await expect(codeOf(createBatch('Huge', tooMany, 'Ravi'))).resolves.toBe('BAD_USER_INPUT');
    expect(await EmailVerificationBatchModel.countDocuments()).toBe(0);
  });

  it('lists recent bulk checks newest first, with their size but not their addresses', async () => {
    await createBatch('First', ['a@acme.test', 'b@acme.test'], 'Ravi');
    await new Promise((resolve) => setTimeout(resolve, 5));
    await createBatch('Second', ['c@acme.test'], 'Ravi');

    const batches = await listBatches();

    expect(batches).toEqual([
      expect.objectContaining({ name: 'Second', total: 1 }),
      expect.objectContaining({ name: 'First', total: 2 }),
    ]);
    expect(batches[0]).not.toHaveProperty('emails');
  });

  it('a pass with nothing queued checks nothing', async () => {
    await expect(runBatchPass()).resolves.toBe(0);
  });

  it('works through the oldest batch a dozen at a time, counting each result, then finishes', async () => {
    const emails = Array.from({ length: 11 }, (_, at) => `ok${at}@acme.test`);
    const calls = fakeReacher({ 'risky@acme.test': RISKY, 'down@acme.test': 'down' });
    jest.spyOn(logger, 'warn').mockImplementation(() => logger);
    const first = await createBatch(
      'Oldest',
      ['not-an-address', 'risky@acme.test', ...emails, 'down@acme.test'],
      'Ravi',
    );
    await new Promise((resolve) => setTimeout(resolve, 5));
    await createBatch('Newer', ['later@acme.test'], 'Meera');

    await expect(runBatchPass()).resolves.toBe(12);
    const running = await EmailVerificationBatchModel.findById(first._id).lean();
    expect(running).toMatchObject({
      status: 'RUNNING',
      processed: 12,
      verified: 10,
      risky: 1,
      invalid: 1,
      unknown: 0,
      finishedAt: null,
    });

    await expect(runBatchPass()).resolves.toBe(2);
    const done = await EmailVerificationBatchModel.findById(first._id).lean();
    expect(done).toMatchObject({ status: 'DONE', processed: 14, verified: 11, unknown: 1 });
    expect(done?.finishedAt).toBeInstanceOf(Date);

    const down = await EmailVerificationModel.findOne({ email: 'down@acme.test' }).lean();
    expect(down).toMatchObject({
      status: 'UNKNOWN',
      reason: 'The verifier could not be reached',
      syntaxValid: true,
      source: 'BULK',
      checkedBy: 'Ravi',
      batchId: first._id.toHexString(),
    });
    expect(calls.map((call) => call.to_email)).not.toContain('not-an-address');

    await expect(runBatchPass()).resolves.toBe(1);
    const newer = await EmailVerificationModel.findOne({ email: 'later@acme.test' }).lean();
    expect(newer?.checkedBy).toBe('Meera');
  });
});
