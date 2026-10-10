import { Types } from 'mongoose';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { WebsiteSubmissionModel } from '../../../../src/modules/website/models';
import { SUBMISSION_FORM_TYPES } from '../../../../src/modules/website/website.constants';
import { websiteSubmissionResolvers } from '../../../../src/modules/website/website.submissions.resolvers';
import type { TableQueryInput } from '../../../../src/utils/tableQuery';
import { adminCtx, backdate, customerEditorCtx, seedSubmission } from './website.fixtures';

const Q = websiteSubmissionResolvers.Query;
const M = websiteSubmissionResolvers.Mutation;

const codeOf = (promise: Promise<unknown>, code: string) =>
  expect(promise).rejects.toMatchObject({ extensions: { code } });

const page = (input: Partial<TableQueryInput>) =>
  Q.listWebsiteSubmissionsPaged(null, { input: { page: 0, pageSize: 25, ...input } }, adminCtx());

const missingId = () => new Types.ObjectId().toHexString();

describe('reading the website inbox', () => {
  it('lists every submission, newest first, with its id', async () => {
    const old = await seedSubmission('newsletter');
    await backdate(old._id, 2);
    await seedSubmission('contact');

    const rows = await Q.listWebsiteSubmissions(null, null, adminCtx());

    expect(rows.map((row) => (row as unknown as { formType: string }).formType)).toEqual([
      'contact',
      'newsletter',
    ]);
    expect(rows[1].id).toBe(old._id.toHexString());
  });

  it('pages and filters the grid on the columns it shows', async () => {
    await seedSubmission('contact', {}, { status: 'resolved' });
    await seedSubmission('legal', {}, { status: 'new' });

    const resolved = await page({
      filters: [{ field: 'status', op: 'EQUALS', value: 'resolved' }],
    });

    expect(resolved.totalCount).toBe(1);
    expect(resolved.rows[0]).toMatchObject({ formType: 'contact', status: 'resolved' });
  });

  it('searches the notes but never the free-form data a visitor sent', async () => {
    await seedSubmission('contact', { message: 'pineapple' }, { notes: '' });
    await seedSubmission('legal', { message: '' }, { notes: 'Called back about pineapple' });

    const found = await page({ search: 'pineapple' });

    expect(found.totalCount).toBe(1);
    expect(found.rows[0]).toMatchObject({ formType: 'legal' });
  });

  it('counts submissions by status and by form', async () => {
    await seedSubmission('contact');
    await seedSubmission('contact', {}, { status: 'archived' });
    await seedSubmission('legal');

    const stats = await Q.listWebsiteSubmissionsStats(null, null, adminCtx());

    expect(stats.total).toBe(3);
    const buckets = (field: string) =>
      (stats.counts.find((count) => count.field === field)?.buckets ?? [])
        .map((bucket) => `${bucket.value}:${bucket.count}`)
        .sort((a, b) => a.localeCompare(b));
    expect(buckets('status')).toEqual(['archived:1', 'new:2']);
    expect(buckets('formType')).toEqual(['contact:2', 'legal:1']);
  });

  it('opens one submission, and says so when it does not exist', async () => {
    const row = await seedSubmission('career', { email: 'cv@example.com' });

    const opened = await Q.getWebsiteSubmission(null, { id: row._id.toHexString() }, adminCtx());

    expect(opened).toMatchObject({ id: row._id.toHexString(), formType: 'career' });
    await codeOf(Q.getWebsiteSubmission(null, { id: missingId() }, adminCtx()), 'NOT_FOUND');
  });

  it('offers exactly the forms the public mutation accepts, as a copy', () => {
    const offered: string[] = Q.websiteFormTypes();
    expect(offered).toEqual([...SUBMISSION_FORM_TYPES]);

    offered.push('invented');
    expect(Q.websiteFormTypes()).not.toContain('invented');
  });
});

describe('triaging the website inbox', () => {
  it('records the new status and the notes', async () => {
    const row = await seedSubmission();

    const updated = await M.triageWebsiteSubmission(
      null,
      { id: row._id.toHexString(), input: { status: 'resolved', notes: 'Replied by phone' } },
      adminCtx(),
    );

    expect(updated).toMatchObject({ status: 'resolved', notes: 'Replied by phone' });
  });

  it('clears the notes when none are sent', async () => {
    const row = await seedSubmission('contact', {}, { notes: 'stale' });

    await M.triageWebsiteSubmission(
      null,
      { id: row._id.toHexString(), input: { status: 'archived' } },
      adminCtx(),
    );

    expect((await WebsiteSubmissionModel.findById(row._id).lean())?.notes).toBe('');
  });

  it('refuses a status the inbox does not know, and changes nothing', async () => {
    const row = await seedSubmission();

    await codeOf(
      M.triageWebsiteSubmission(
        null,
        { id: row._id.toHexString(), input: { status: 'spam' } },
        adminCtx(),
      ),
      'BAD_USER_INPUT',
    );
    expect((await WebsiteSubmissionModel.findById(row._id).lean())?.status).toBe('new');
  });

  it('says so when the submission does not exist', async () => {
    await codeOf(
      M.triageWebsiteSubmission(null, { id: missingId(), input: { status: 'new' } }, adminCtx()),
      'NOT_FOUND',
    );
  });

  it('deletes a submission, and says so when there is none to delete', async () => {
    const row = await seedSubmission();

    await expect(
      M.deleteWebsiteSubmission(null, { id: row._id.toHexString() }, adminCtx()),
    ).resolves.toBe(true);
    expect(await WebsiteSubmissionModel.countDocuments()).toBe(0);
    await codeOf(
      M.deleteWebsiteSubmission(null, { id: row._id.toHexString() }, adminCtx()),
      'NOT_FOUND',
    );
  });
});

describe('who may use the inbox', () => {
  const anonymous: GraphQLContext = { user: null };

  it('asks a visitor who is not signed in to sign in', async () => {
    await codeOf(Q.listWebsiteSubmissions(null, null, anonymous), 'UNAUTHENTICATED');
  });

  it('refuses a website editor of a customer company', async () => {
    await seedSubmission();
    const ctx = customerEditorCtx();

    await codeOf(Q.listWebsiteSubmissionsStats(null, null, ctx), 'FORBIDDEN');
    await codeOf(M.deleteWebsiteSubmission(null, { id: missingId() }, ctx), 'FORBIDDEN');
    expect(await WebsiteSubmissionModel.countDocuments()).toBe(1);
  });

  it('hands out a security question to anybody', () => {
    expect(Q.websiteCaptcha().question).toMatch(/^\d+ \+ \d+$/);
  });
});
