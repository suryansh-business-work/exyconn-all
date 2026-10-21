import type { GraphQLContext } from '../../middleware/auth';
import type { TableQueryInput } from '../../utils/tableQuery';
import { badRequest } from '../../utils/errors';
import { UserModel } from '../admin/user.model';
import {
  assertMaUser,
  editableMeeting,
  ownedMeeting,
  readableMeeting,
  scopeFilter,
  type MaScope,
} from './ma.access';
import { recordMaActivity } from './ma.activity';
import {
  eventsPage,
  meetingParticipants,
  meetingsPage,
  participantsPage,
  presentMeetings,
  transcriptSearch,
  transcriptSlice,
  type TranscriptSlice,
} from './meeting.queries';
import { dashboardMatch, meetingDashboard, type DashboardFilter } from './dashboard.service';
import {
  finalizeSession,
  heartbeat,
  recordConsent,
  startSession,
  type HeartbeatInput,
  type StartSessionInput,
} from './meeting.lifecycle';
import { recordParticipantEvents, type ParticipantEvent } from './participants.service';
import { deleteMeetingData } from './meeting.delete';
import { MaMeetingModel, type MaMeetingDocument } from './models';
import type { MaLanguage } from './ma.enums';

type LeanMeeting = MaMeetingDocument & { _id: unknown };
type Ctx = GraphQLContext;

const one = async (meeting: LeanMeeting) => (await presentMeetings([meeting]))[0];

const reload = async (meeting: LeanMeeting) =>
  one((await MaMeetingModel.findById(meeting._id).lean<LeanMeeting>()) ?? meeting);

export const maMeetingQueries = {
  maDashboard: async (
    _p: unknown,
    { filter }: { filter?: DashboardFilter & { scope?: MaScope } },
    ctx: Ctx,
  ) => {
    const actor = await assertMaUser(ctx);
    const scope = await scopeFilter(ctx, actor, filter?.scope);
    return meetingDashboard(await dashboardMatch(scope, filter ?? {}));
  },
  maMeetingsPaged: async (
    _p: unknown,
    args: { input: TableQueryInput; scope?: MaScope },
    ctx: Ctx,
  ) => {
    const actor = await assertMaUser(ctx);
    return meetingsPage(args.input, await scopeFilter(ctx, actor, args.scope));
  },
  maMeeting: async (_p: unknown, { id }: { id: string }, ctx: Ctx) =>
    one(await readableMeeting(ctx, await assertMaUser(ctx), id)),
  maTranscript: async (_p: unknown, args: TranscriptSlice & { meetingId: string }, ctx: Ctx) =>
    transcriptSlice(await readableMeeting(ctx, await assertMaUser(ctx), args.meetingId), args),
  maTranscriptSearch: async (
    _p: unknown,
    args: { input: TableQueryInput; scope?: MaScope },
    ctx: Ctx,
  ) => {
    const actor = await assertMaUser(ctx);
    return transcriptSearch(args.input, await scopeFilter(ctx, actor, args.scope));
  },
  maParticipants: async (_p: unknown, { meetingId }: { meetingId: string }, ctx: Ctx) => {
    await readableMeeting(ctx, await assertMaUser(ctx), meetingId);
    return meetingParticipants(meetingId);
  },
  maParticipantsPaged: async (
    _p: unknown,
    args: { input: TableQueryInput; scope?: MaScope },
    ctx: Ctx,
  ) => {
    const actor = await assertMaUser(ctx);
    return participantsPage(args.input, await scopeFilter(ctx, actor, args.scope));
  },
  maEventsPaged: async (
    _p: unknown,
    args: { input: TableQueryInput; scope?: MaScope; meetingId?: string },
    ctx: Ctx,
  ) => {
    const actor = await assertMaUser(ctx);
    if (args.meetingId) {
      await readableMeeting(ctx, actor, args.meetingId);
      return eventsPage(args.input, {}, args.meetingId);
    }
    return eventsPage(args.input, await scopeFilter(ctx, actor, args.scope));
  },
};

/** A portal account a speaker label is confirmed as, which must be in the caller's company. */
async function speakerUser(userId?: string | null): Promise<string | null> {
  if (!userId) {
    return null;
  }
  if (!(await UserModel.exists({ _id: userId }))) {
    badRequest('That person is not in your company.');
  }
  return userId;
}

export const maMeetingMutations = {
  maUpdateMeeting: async (
    _p: unknown,
    args: { id: string; input: { title: string; language: MaLanguage } },
    ctx: Ctx,
  ) => {
    const actor = await assertMaUser(ctx);
    const meeting = await editableMeeting(ctx, actor, args.id);
    const title = args.input.title.trim().slice(0, 300);
    await MaMeetingModel.updateOne(
      { _id: meeting._id },
      { $set: { title, language: args.input.language } },
    );
    await recordMaActivity(ctx, actor, {
      type: 'MEETING_UPDATED',
      action: 'UPDATE',
      summary: `Renamed the meeting to "${title}"`,
      meeting: { ...meeting, title },
    });
    return reload(meeting);
  },
  maDeleteMeeting: async (_p: unknown, { id }: { id: string }, ctx: Ctx) => {
    const actor = await assertMaUser(ctx);
    const meeting = await editableMeeting(ctx, actor, id);
    await deleteMeetingData(String(meeting._id));
    await recordMaActivity(ctx, actor, {
      type: 'MEETING_DELETED',
      action: 'DELETE',
      summary: `Deleted the meeting "${meeting.title}" and everything recorded for it`,
    });
    return true;
  },
  maConfirmSpeaker: async (
    _p: unknown,
    args: { meetingId: string; input: { label: string; name: string; userId?: string } },
    ctx: Ctx,
  ) => {
    const actor = await assertMaUser(ctx);
    const meeting = await editableMeeting(ctx, actor, args.meetingId);
    const label = args.input.label.trim();
    const name = args.input.name.trim().slice(0, 200);
    if (label === '' || name === '') {
      badRequest('Choose a speaker label and a name.');
    }
    const userId = await speakerUser(args.input.userId);
    const mapping = {
      label,
      name,
      userId,
      confirmedById: actor.id,
      confirmedByName: actor.name,
      confirmedAt: new Date(),
    };
    await MaMeetingModel.updateOne({ _id: meeting._id }, { $pull: { speakerMappings: { label } } });
    await MaMeetingModel.updateOne(
      { _id: meeting._id },
      {
        $push: { speakerMappings: mapping },
        ...(userId ? { $addToSet: { viewerIds: userId } } : {}),
      },
    );
    await recordMaActivity(ctx, actor, {
      type: 'SPEAKER_CONFIRMED',
      action: 'UPDATE',
      summary: `Confirmed "${label}" as ${name}`,
      meeting,
    });
    return reload(meeting);
  },
  maStartSession: async (_p: unknown, { input }: { input: StartSessionInput }, ctx: Ctx) => {
    const actor = await assertMaUser(ctx);
    const meeting = await startSession(actor, { ...input, startedAt: new Date(input.startedAt) });
    await recordMaActivity(ctx, actor, {
      type: 'SESSION_STARTED',
      action: 'ACCESS',
      summary: `Joined the Google Meet call ${meeting.meetingCode} with the Meeting Assistant`,
      meeting,
      details: { meetingCode: meeting.meetingCode },
    });
    return one(meeting);
  },
  maRecordConsent: async (_p: unknown, { meetingId }: { meetingId: string }, ctx: Ctx) => {
    const actor = await assertMaUser(ctx);
    const meeting = await recordConsent(await ownedMeeting(actor, meetingId));
    await recordMaActivity(ctx, actor, {
      type: 'CONSENT_CONFIRMED',
      action: 'ACCESS',
      summary: 'Confirmed participants were told the call is being recorded and transcribed',
      meeting,
    });
    return one(meeting);
  },
  maHeartbeat: async (
    _p: unknown,
    args: { meetingId: string; input: HeartbeatInput },
    ctx: Ctx,
  ) => {
    const actor = await assertMaUser(ctx);
    const before = await ownedMeeting(actor, args.meetingId);
    const meeting = await heartbeat(before, args.input);
    if (before.captureState !== meeting.captureState) {
      await recordMaActivity(ctx, actor, {
        type: 'CAPTURE_STATE',
        action: 'ACCESS',
        summary: `Recording ${meeting.captureState.toLowerCase()} (was ${before.captureState.toLowerCase()})`,
        meeting,
        details: { from: before.captureState, to: meeting.captureState },
      });
    }
    return one(meeting);
  },
  maRecordParticipantEvents: async (
    _p: unknown,
    args: { meetingId: string; events: ParticipantEvent[] },
    ctx: Ctx,
  ) => {
    const actor = await assertMaUser(ctx);
    const meeting = await ownedMeeting(actor, args.meetingId);
    const events = args.events.map((event) => ({ ...event, at: new Date(event.at) }));
    return recordParticipantEvents(String(meeting._id), actor, events);
  },
  maFinalizeSession: async (_p: unknown, args: { meetingId: string; endedAt: Date }, ctx: Ctx) => {
    const actor = await assertMaUser(ctx);
    const before = await ownedMeeting(actor, args.meetingId);
    const meeting = await finalizeSession(before, new Date(args.endedAt));
    if (before.status === 'ACTIVE') {
      await recordMaActivity(ctx, actor, {
        type: 'SESSION_ENDED',
        action: 'UPDATE',
        summary: `Left the call; ${meeting.segmentCount} transcript line(s) recorded`,
        meeting,
        details: {
          segments: meeting.segmentCount,
          summary: meeting.summaryStatus,
          officialImport: meeting.officialImportStatus,
        },
      });
    }
    return one(meeting);
  },
};
