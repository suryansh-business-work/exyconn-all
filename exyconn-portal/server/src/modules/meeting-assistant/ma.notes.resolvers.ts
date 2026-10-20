import type { GraphQLContext } from '../../middleware/auth';
import type { TableQueryInput } from '../../utils/tableQuery';
import { badRequest, notFound } from '../../utils/errors';
import {
  assertMaUser,
  editableMeeting,
  readableMeeting,
  scopeFilter,
  type MaActor,
  type MaScope,
} from './ma.access';
import { recordMaActivity } from './ma.activity';
import {
  actionsPage,
  actionStats,
  addComment,
  createAction,
  seriesActions,
  setActionStatus,
  updateAction,
  MAX_BULK,
  type ActionInput,
} from './actions.service';
import { updateNotes } from './notes.service';
import { previewSummary, retryDelivery } from './ma.email';
import { enqueueMaJob } from './jobs.queue';
import { presentMeetings } from './meeting.queries';
import {
  MaActionItemModel,
  MaDecisionModel,
  MaDeliveryModel,
  MaMeetingModel,
  MaNotesModel,
  type MaNotesContent,
} from './models';
import type { ActionStatus, MaSummaryStyle, Priority } from './ma.enums';

type Ctx = GraphQLContext;
const withId = <T extends { _id: unknown }>(row: T) => ({ ...row, id: String(row._id) });

/** An action item the caller may change: through a meeting they may edit. */
async function editableAction(ctx: Ctx, actor: MaActor, id: string) {
  const item = await MaActionItemModel.findById(id).select('meetingId title').lean();
  if (!item) {
    notFound('Action item');
  }
  const meeting = await editableMeeting(ctx, actor, item.meetingId);
  return { item, meeting };
}

export const maNotesQueries = {
  maNotes: async (_p: unknown, { meetingId }: { meetingId: string }, ctx: Ctx) => {
    await readableMeeting(ctx, await assertMaUser(ctx), meetingId);
    const notes = await MaNotesModel.findOne({ meetingId }).lean();
    return notes ? withId(notes) : null;
  },
  maDecisions: async (_p: unknown, { meetingId }: { meetingId: string }, ctx: Ctx) => {
    await readableMeeting(ctx, await assertMaUser(ctx), meetingId);
    return (await MaDecisionModel.find({ meetingId }).sort({ createdAt: 1 }).lean()).map(withId);
  },
  maActionItemsPaged: async (
    _p: unknown,
    args: { input: TableQueryInput; scope?: MaScope; meetingId?: string },
    ctx: Ctx,
  ) => {
    const actor = await assertMaUser(ctx);
    if (args.meetingId) {
      await readableMeeting(ctx, actor, args.meetingId);
      return actionsPage(args.input, {}, args.meetingId);
    }
    return actionsPage(args.input, await scopeFilter(ctx, actor, args.scope));
  },
  maActionStats: async (_p: unknown, args: { scope?: MaScope; meetingId?: string }, ctx: Ctx) => {
    const actor = await assertMaUser(ctx);
    if (args.meetingId) {
      await readableMeeting(ctx, actor, args.meetingId);
      return actionStats({}, args.meetingId);
    }
    return actionStats(await scopeFilter(ctx, actor, args.scope));
  },
  maFollowUp: async (_p: unknown, { meetingId }: { meetingId: string }, ctx: Ctx) => {
    const actor = await assertMaUser(ctx);
    const meeting = await readableMeeting(ctx, actor, meetingId);
    const scope = await scopeFilter(ctx, actor, 'MINE');
    const previous = meeting.previousMeetingId
      ? await MaMeetingModel.findOne({ _id: meeting.previousMeetingId, ...scope }).lean()
      : null;
    const notes = previous
      ? await MaNotesModel.findOne({ meetingId: String(previous._id) }).lean()
      : null;
    const decisions = previous
      ? await MaDecisionModel.find({ meetingId: String(previous._id) }).lean()
      : [];
    return {
      previousMeeting: previous ? (await presentMeetings([previous]))[0] : null,
      previousSummary: notes?.content.executiveSummary || null,
      previousDecisions: decisions.map(withId),
      ...(await seriesActions(meeting, scope)),
      unresolvedBlockers: notes?.content.blockers ?? [],
      carriedTopics: [
        ...(notes?.content.nextTopics ?? []),
        ...(notes?.content.openQuestions ?? []),
      ],
    };
  },
  maEmailDeliveries: async (_p: unknown, { meetingId }: { meetingId: string }, ctx: Ctx) => {
    await readableMeeting(ctx, await assertMaUser(ctx), meetingId);
    return (
      await MaDeliveryModel.find({ meetingId }).sort({ createdAt: -1 }).limit(200).lean()
    ).map(withId);
  },
  maEmailPreview: async (_p: unknown, { meetingId }: { meetingId: string }, ctx: Ctx) =>
    previewSummary(await readableMeeting(ctx, await assertMaUser(ctx), meetingId)),
};

export const maNotesMutations = {
  maRegenerateNotes: async (
    _p: unknown,
    args: { meetingId: string; style: MaSummaryStyle },
    ctx: Ctx,
  ) => {
    const actor = await assertMaUser(ctx);
    const meeting = await editableMeeting(ctx, actor, args.meetingId);
    if (meeting.status !== 'ENDED' || meeting.segmentCount === 0) {
      badRequest('Notes can be written once the call has ended and has a transcript.');
    }
    await enqueueMaJob('ANALYZE', String(meeting._id), {
      round: `regen-${Date.now()}`,
      style: args.style,
      requestedBy: actor,
    });
    await MaMeetingModel.updateOne(
      { _id: meeting._id },
      { $set: { summaryStatus: 'QUEUED', summaryError: '' } },
    );
    await recordMaActivity(ctx, actor, {
      type: 'NOTES_REGENERATE',
      action: 'UPDATE',
      summary: `Asked for new ${args.style.toLowerCase()} notes`,
      meeting,
    });
    return (await presentMeetings([{ ...meeting, summaryStatus: 'QUEUED' }]))[0];
  },
  maUpdateNotes: async (
    _p: unknown,
    args: { meetingId: string; content: MaNotesContent; expectedVersion: number },
    ctx: Ctx,
  ) => {
    const actor = await assertMaUser(ctx);
    const meeting = await editableMeeting(ctx, actor, args.meetingId);
    const notes = await updateNotes(args.meetingId, args.content, args.expectedVersion, actor);
    await recordMaActivity(ctx, actor, {
      type: 'NOTES_EDITED',
      action: 'UPDATE',
      summary: `Edited the meeting notes (version ${notes.version})`,
      meeting,
    });
    return notes;
  },
  maCreateActionItem: async (
    _p: unknown,
    args: { meetingId: string; input: ActionInput },
    ctx: Ctx,
  ) => {
    const actor = await assertMaUser(ctx);
    const meeting = await editableMeeting(ctx, actor, args.meetingId);
    const item = await createAction(meeting, args.input, actor);
    await recordMaActivity(ctx, actor, {
      type: 'ACTION_CREATED',
      action: 'CREATE',
      summary: `Added the action item "${item.title}"`,
      meeting,
    });
    return item;
  },
  maUpdateActionItem: async (_p: unknown, args: { id: string; input: ActionInput }, ctx: Ctx) => {
    const actor = await assertMaUser(ctx);
    const { meeting } = await editableAction(ctx, actor, args.id);
    const item = await updateAction(args.id, args.input, actor);
    await recordMaActivity(ctx, actor, {
      type: 'ACTION_UPDATED',
      action: 'UPDATE',
      summary: `Updated the action item "${item.title}"`,
      meeting,
    });
    return item;
  },
  maSetActionStatus: async (_p: unknown, args: { id: string; status: ActionStatus }, ctx: Ctx) => {
    const actor = await assertMaUser(ctx);
    const { meeting } = await editableAction(ctx, actor, args.id);
    const item = await setActionStatus(args.id, args.status, actor);
    await recordMaActivity(ctx, actor, {
      type: 'ACTION_STATUS',
      action: 'UPDATE',
      summary: `Marked "${item.title}" ${args.status.toLowerCase().replace('_', ' ')}`,
      meeting,
    });
    return item;
  },
  maBulkUpdateActionItems: async (
    _p: unknown,
    { input }: { input: { ids: string[]; status?: ActionStatus; priority?: Priority } },
    ctx: Ctx,
  ) => {
    const actor = await assertMaUser(ctx);
    if (input.ids.length > MAX_BULK || (!input.status && !input.priority)) {
      badRequest(`Choose a status or priority for up to ${MAX_BULK} items.`);
    }
    const outcomes = await Promise.all(
      [...new Set(input.ids)].map(async (id) => {
        const { item } = await editableAction(ctx, actor, id);
        const full = await MaActionItemModel.findById(id).lean();
        if (!full) {
          return 0;
        }
        await updateAction(
          id,
          {
            title: item.title,
            description: full.description,
            assignedTo: full.assignedTo,
            assignedUserId: full.assignedUserId,
            dueDate: full.dueDate,
            priority: (input.priority ?? full.priority) as Priority,
            status: (input.status ?? full.status) as ActionStatus,
          },
          actor,
        );
        return 1;
      }),
    );
    const updated = outcomes.reduce<number>((sum, count) => sum + count, 0);
    await recordMaActivity(ctx, actor, {
      type: 'ACTION_BULK',
      action: 'UPDATE',
      summary: `Updated ${updated} action item(s) at once`,
      details: { count: updated },
    });
    return updated;
  },
  maDeleteActionItem: async (_p: unknown, { id }: { id: string }, ctx: Ctx) => {
    const actor = await assertMaUser(ctx);
    const { item, meeting } = await editableAction(ctx, actor, id);
    await MaActionItemModel.deleteOne({ _id: id });
    await recordMaActivity(ctx, actor, {
      type: 'ACTION_DELETED',
      action: 'DELETE',
      summary: `Deleted the action item "${item.title}"`,
      meeting,
    });
    return true;
  },
  maAddActionComment: async (_p: unknown, args: { id: string; text: string }, ctx: Ctx) => {
    const actor = await assertMaUser(ctx);
    const { meeting } = await editableAction(ctx, actor, args.id);
    const item = await addComment(args.id, args.text, actor);
    await recordMaActivity(ctx, actor, {
      type: 'ACTION_COMMENT',
      action: 'UPDATE',
      summary: `Commented on "${item.title}"`,
      meeting,
    });
    return item;
  },
  maSendSummaryEmail: async (_p: unknown, { meetingId }: { meetingId: string }, ctx: Ctx) => {
    const actor = await assertMaUser(ctx);
    const meeting = await editableMeeting(ctx, actor, meetingId);
    const notes = await MaNotesModel.findOne({ meetingId }).select('version').lean();
    if (!notes || meeting.summaryStatus !== 'READY') {
      badRequest('The notes are not ready, so there is nothing to send yet.');
    }
    await enqueueMaJob('EMAIL', meetingId, { round: notes.version, requestedBy: actor });
    await MaMeetingModel.updateOne({ _id: meeting._id }, { $set: { emailStatus: 'QUEUED' } });
    await recordMaActivity(ctx, actor, {
      type: 'EMAIL_APPROVED',
      action: 'UPDATE',
      summary: `Sent the meeting summary (version ${notes.version})`,
      meeting,
    });
    return (await presentMeetings([{ ...meeting, emailStatus: 'QUEUED' }]))[0];
  },
  maRetryEmailDelivery: async (_p: unknown, { id }: { id: string }, ctx: Ctx) => {
    const actor = await assertMaUser(ctx);
    const delivery = await MaDeliveryModel.findById(id).select('meetingId recipient').lean();
    if (!delivery) {
      notFound('Email delivery');
    }
    const meeting = await editableMeeting(ctx, actor, delivery.meetingId);
    const result = await retryDelivery(meeting, id);
    await recordMaActivity(ctx, actor, {
      type: 'EMAIL_RETRY',
      action: 'UPDATE',
      summary: `Retried the summary email to ${delivery.recipient}`,
      meeting,
    });
    return result ? withId(result) : null;
  },
};
