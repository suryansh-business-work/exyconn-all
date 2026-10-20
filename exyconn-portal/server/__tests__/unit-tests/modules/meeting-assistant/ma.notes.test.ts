import { Types } from 'mongoose';
import {
  renderStoredTemplate,
  sendTemplateEmail,
} from '../../../../src/modules/email/email.service';
import {
  maNotesMutations,
  maNotesQueries,
} from '../../../../src/modules/meeting-assistant/ma.notes.resolvers';
import { cleanContent } from '../../../../src/modules/meeting-assistant/notes.service';
import {
  MaActionItemModel,
  MaDecisionModel,
  MaDeliveryModel,
  MaJobModel,
  MaNotesModel,
} from '../../../../src/modules/meeting-assistant/models';
import {
  addComment,
  updateAction,
  type ActionInput,
} from '../../../../src/modules/meeting-assistant/actions.service';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import type { MaActor } from '../../../../src/modules/meeting-assistant/ma.access';
import { codeOf } from '../codeOf';
import { ctxOf, PAGE, seedAccount, seedMeeting, type LeanMeeting } from './ma.fixtures';

jest.mock('../../../../src/modules/email/email.service', () => ({
  sendTemplateEmail: jest.fn(),
  renderStoredTemplate: jest.fn(),
}));

const send = sendTemplateEmail as jest.Mock;

let owner: MaActor;
let other: MaActor;
let asOwner: GraphQLContext;
let asOther: GraphQLContext;

const CONTENT = {
  overview: ' Overview ',
  executiveSummary: 'Summary',
  agenda: [' one ', '  '],
  discussionPoints: [],
  risks: [],
  blockers: ['Waiting on legal'],
  openQuestions: ['Budget?'],
  followUps: [],
  nextTopics: ['Hiring'],
};

const writeNotes = (meeting: LeanMeeting) =>
  MaNotesModel.create({
    meetingId: String(meeting._id),
    style: 'DETAILED',
    model: 'gpt-4o',
    generatedAt: new Date(),
    original: CONTENT,
    content: CONTENT,
  });

const actionInput = (overrides: Partial<ActionInput> = {}): ActionInput => ({
  title: 'Send the deck',
  description: '',
  priority: 'MEDIUM',
  status: 'PENDING',
  ...overrides,
});

const createAction = (meeting: LeanMeeting, overrides: Partial<ActionInput> = {}) =>
  maNotesMutations.maCreateActionItem(
    null,
    { meetingId: String(meeting._id), input: actionInput(overrides) },
    asOwner,
  );

beforeEach(async () => {
  owner = await seedAccount('Asha', [ROLES.EMPLOYEE]);
  other = await seedAccount('Ravi', [ROLES.EMPLOYEE]);
  asOwner = ctxOf(owner, [ROLES.EMPLOYEE]);
  asOther = ctxOf(other, [ROLES.EMPLOYEE]);
  send.mockResolvedValue(undefined);
});

describe('notes', () => {
  it('reads the notes and decisions of a readable meeting, and nothing of another’s', async () => {
    const meeting = await seedMeeting(owner);
    const meetingId = String(meeting._id);
    await writeNotes(meeting);
    await MaDecisionModel.create({ meetingId, fingerprint: 'f', text: 'Ship it' });

    expect((await maNotesQueries.maNotes(null, { meetingId }, asOwner))?.version).toBe(1);
    expect(
      (await maNotesQueries.maDecisions(null, { meetingId }, asOwner)).map((d) => d.text),
    ).toEqual(['Ship it']);
    expect(await codeOf(maNotesQueries.maNotes(null, { meetingId }, asOther))).toBe('NOT_FOUND');
    const empty = await seedMeeting(owner, { meetingCode: 'xyz-wxyz-xyz' });
    expect(
      await maNotesQueries.maNotes(null, { meetingId: String(empty._id) }, asOwner),
    ).toBeNull();
  });

  it('saves an edit as the next version, cleaned, and refuses a stale one', async () => {
    const meeting = await seedMeeting(owner);
    const meetingId = String(meeting._id);
    await writeNotes(meeting);
    const edit = (expectedVersion: number) =>
      maNotesMutations.maUpdateNotes(
        null,
        { meetingId, content: CONTENT, expectedVersion },
        asOwner,
      );

    const saved = await edit(1);

    expect(saved).toMatchObject({ version: 2, edited: true });
    expect(saved.content).toMatchObject({ overview: 'Overview', agenda: ['one'] });
    expect(saved.revisions.map((r) => [r.version, r.byName])).toEqual([[1, 'Asha']]);
    expect(await codeOf(edit(1))).toBe('BAD_USER_INPUT');
    const none = await seedMeeting(owner, { meetingCode: 'xyz-wxyz-xyz' });
    expect(
      await codeOf(
        maNotesMutations.maUpdateNotes(
          null,
          { meetingId: String(none._id), content: CONTENT, expectedVersion: 1 },
          asOwner,
        ),
      ),
    ).toBe('NOT_FOUND');
  });

  it('lets only one of two people editing the same version save', async () => {
    const meeting = await seedMeeting(owner);
    const meetingId = String(meeting._id);
    await writeNotes(meeting);
    const edit = () =>
      codeOf(
        maNotesMutations.maUpdateNotes(
          null,
          { meetingId, content: CONTENT, expectedVersion: 1 },
          asOwner,
        ),
      );

    const outcomes = await Promise.all([edit(), edit()]);

    expect(outcomes).toHaveLength(2);
    expect(outcomes).toEqual(expect.arrayContaining(['OK', 'BAD_USER_INPUT']));
    expect((await MaNotesModel.findOne({ meetingId }).lean())?.version).toBe(2);
  });

  it('caps every section the way the model’s own output is capped', () => {
    const long = cleanContent({
      ...CONTENT,
      overview: 'x'.repeat(5000),
      risks: Array(50).fill('r'),
    });

    expect(long.overview).toHaveLength(4000);
    expect(long.risks).toHaveLength(40);
  });

  it('queues a regenerate only for an ended call with a transcript', async () => {
    const live = await seedMeeting(owner);
    const ended = await seedMeeting(owner, {
      meetingCode: 'xyz-wxyz-xyz',
      status: 'ENDED',
      segmentCount: 3,
    });
    const regenerate = (meeting: LeanMeeting) =>
      maNotesMutations.maRegenerateNotes(
        null,
        { meetingId: String(meeting._id), style: 'EXECUTIVE' },
        asOwner,
      );

    expect(await codeOf(regenerate(live))).toBe('BAD_USER_INPUT');
    expect((await regenerate(ended)).summaryStatus).toBe('QUEUED');
    expect(await MaJobModel.findOne({ meetingId: String(ended._id) }).lean()).toMatchObject({
      kind: 'ANALYZE',
      style: 'EXECUTIVE',
      requestedByName: 'Asha',
    });
  });
});

describe('action items', () => {
  it('creates, edits, comments on and deletes an item through its meeting', async () => {
    const meeting = await seedMeeting(owner);
    const created = await createAction(meeting, { status: 'COMPLETED', assignedTo: '  Ravi ' });

    expect(created).toMatchObject({ title: 'Send the deck', assignedTo: 'Ravi', overdue: false });
    expect(created.completedAt).toBeInstanceOf(Date);
    const updated = await maNotesMutations.maUpdateActionItem(
      null,
      {
        id: created.id,
        input: actionInput({ priority: 'HIGH', dueDate: new Date(Date.now() - 86_400_000) }),
      },
      asOwner,
    );
    expect(updated).toMatchObject({ priority: 'HIGH', status: 'PENDING', overdue: true });

    const commented = await maNotesMutations.maAddActionComment(
      null,
      { id: created.id, text: ' Done soon ' },
      asOwner,
    );
    expect(commented.comments.map((c) => [c.text, c.byName])).toEqual([['Done soon', 'Asha']]);
    expect(
      await codeOf(
        maNotesMutations.maAddActionComment(null, { id: created.id, text: ' ' }, asOwner),
      ),
    ).toBe('BAD_USER_INPUT');

    expect(
      await codeOf(maNotesMutations.maDeleteActionItem(null, { id: created.id }, asOther)),
    ).toBe('NOT_FOUND');
    expect(await maNotesMutations.maDeleteActionItem(null, { id: created.id }, asOwner)).toBe(true);
    expect(
      await codeOf(maNotesMutations.maDeleteActionItem(null, { id: created.id }, asOwner)),
    ).toBe('NOT_FOUND');
  });

  it('answers not-found for an item that is gone', async () => {
    const missing = new Types.ObjectId().toHexString();

    expect(await codeOf(updateAction(missing, actionInput(), owner))).toBe('NOT_FOUND');
    expect(await codeOf(addComment(missing, 'hello', owner))).toBe('NOT_FOUND');
  });

  it('pages and counts items for a meeting or for everything the caller can see', async () => {
    const meeting = await seedMeeting(owner);
    const first = await createAction(meeting, { dueDate: new Date(Date.now() - 1000) });
    await createAction(meeting, { title: 'Book room', status: 'BLOCKED' });
    await MaActionItemModel.updateOne({ _id: first.id }, { $set: { needsConfirmation: true } });
    const meetingId = String(meeting._id);

    const page = await maNotesQueries.maActionItemsPaged(null, { input: PAGE, meetingId }, asOwner);
    const mine = await maNotesQueries.maActionItemsPaged(null, { input: PAGE }, asOwner);
    const theirs = await maNotesQueries.maActionItemsPaged(null, { input: PAGE }, asOther);

    expect(page.totalCount).toBe(2);
    expect(mine.totalCount).toBe(2);
    expect(theirs.totalCount).toBe(0);
    expect(await maNotesQueries.maActionStats(null, { meetingId }, asOwner)).toMatchObject({
      total: 2,
      pending: 1,
      blocked: 1,
      overdue: 1,
      needsConfirmation: 1,
    });
    expect((await maNotesQueries.maActionStats(null, {}, asOther)).total).toBe(0);
  });

  it('sets a status or priority on many items at once, within limits', async () => {
    const meeting = await seedMeeting(owner);
    const a = await createAction(meeting);
    const b = await createAction(meeting, { title: 'Book room' });
    const bulk = (input: { ids: string[]; status?: 'COMPLETED'; priority?: 'HIGH' }) =>
      maNotesMutations.maBulkUpdateActionItems(null, { input }, asOwner);

    expect(await bulk({ ids: [a.id, b.id, a.id], status: 'COMPLETED', priority: 'HIGH' })).toBe(2);
    expect(await MaActionItemModel.countDocuments({ status: 'COMPLETED', priority: 'HIGH' })).toBe(
      2,
    );
    expect(await codeOf(bulk({ ids: [a.id] }))).toBe('BAD_USER_INPUT');
    expect(await codeOf(bulk({ ids: Array(201).fill(a.id), status: 'COMPLETED' }))).toBe(
      'BAD_USER_INPUT',
    );
    expect(
      await codeOf(
        maNotesMutations.maSetActionStatus(
          null,
          { id: new Types.ObjectId().toHexString(), status: 'BLOCKED' },
          asOwner,
        ),
      ),
    ).toBe('NOT_FOUND');
    expect(
      (await maNotesMutations.maSetActionStatus(null, { id: a.id, status: 'IN_PROGRESS' }, asOwner))
        .status,
    ).toBe('IN_PROGRESS');
  });
});

describe('follow-up from the previous call in the series', () => {
  it('carries the earlier summary, decisions, open actions, blockers and topics', async () => {
    const previous = await seedMeeting(owner, {
      status: 'ENDED',
      startedAt: new Date(Date.now() - 7 * 86_400_000),
    });
    const current = await seedMeeting(owner, {
      meetingCode: 'abc-defg-hij',
      previousMeetingId: String(previous._id),
    });
    await writeNotes(previous);
    await MaDecisionModel.create({
      meetingId: String(previous._id),
      fingerprint: 'f',
      text: 'Hire two',
    });
    await createAction(previous, { title: 'Open item' });
    await createAction(previous, { title: 'Done item', status: 'COMPLETED' });

    const followUp = await maNotesQueries.maFollowUp(
      null,
      { meetingId: String(current._id) },
      asOwner,
    );

    expect(followUp.previousMeeting?.id).toBe(String(previous._id));
    expect(followUp).toMatchObject({
      previousSummary: 'Summary',
      unresolvedBlockers: ['Waiting on legal'],
      carriedTopics: ['Hiring', 'Budget?'],
    });
    expect(followUp.previousDecisions.map((d) => d.text)).toEqual(['Hire two']);
    expect(followUp.pendingActions.map((a) => a.title)).toEqual(['Open item']);
    expect(followUp.completedActions.map((a) => a.title)).toEqual(['Done item']);
  });

  it('is empty for the first call of a series', async () => {
    const meeting = await seedMeeting(owner);

    expect(
      await maNotesQueries.maFollowUp(null, { meetingId: String(meeting._id) }, asOwner),
    ).toMatchObject({
      previousMeeting: null,
      previousSummary: null,
      previousDecisions: [],
      carriedTopics: [],
    });
  });
});

describe('the summary email', () => {
  it('queues the send only once the notes are ready', async () => {
    const meeting = await seedMeeting(owner, { status: 'ENDED' });
    const meetingId = String(meeting._id);
    const sendNow = () => maNotesMutations.maSendSummaryEmail(null, { meetingId }, asOwner);

    expect(await codeOf(sendNow())).toBe('BAD_USER_INPUT');
    await writeNotes(meeting);
    expect(await codeOf(sendNow())).toBe('BAD_USER_INPUT');
    const ready = await seedMeeting(owner, {
      meetingCode: 'xyz-wxyz-xyz',
      status: 'ENDED',
      summaryStatus: 'READY',
    });
    await writeNotes(ready);

    const queued = await maNotesMutations.maSendSummaryEmail(
      null,
      { meetingId: String(ready._id) },
      asOwner,
    );

    expect(queued.emailStatus).toBe('QUEUED');
    expect(await MaJobModel.countDocuments({ kind: 'EMAIL', meetingId: String(ready._id) })).toBe(
      1,
    );
  });

  it('previews the email, lists deliveries and retries a failed one', async () => {
    const meeting = await seedMeeting(owner, { status: 'ENDED' });
    const meetingId = String(meeting._id);
    await writeNotes(meeting);
    (renderStoredTemplate as jest.Mock).mockResolvedValue({ subject: 'S', html: 'H' });
    const failed = await MaDeliveryModel.create({
      meetingId,
      notesVersion: 1,
      recipient: owner.email,
      status: 'FAILED',
      attempts: 3,
    });

    expect(await maNotesQueries.maEmailPreview(null, { meetingId }, asOwner)).toMatchObject({
      subject: 'S',
      recipients: [owner.email],
    });
    expect(
      (await maNotesQueries.maEmailDeliveries(null, { meetingId }, asOwner)).map((d) => d.status),
    ).toEqual(['FAILED']);
    const retried = await maNotesMutations.maRetryEmailDelivery(
      null,
      { id: String(failed._id) },
      asOwner,
    );

    expect(retried).toMatchObject({ status: 'SENT', attempts: 1 });
    expect(send).toHaveBeenCalledTimes(1);
    expect(
      await codeOf(
        maNotesMutations.maRetryEmailDelivery(
          null,
          { id: new Types.ObjectId().toHexString() },
          asOwner,
        ),
      ),
    ).toBe('NOT_FOUND');
  });
});
