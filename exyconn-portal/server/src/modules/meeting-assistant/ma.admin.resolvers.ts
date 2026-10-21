import type { GraphQLContext } from '../../middleware/auth';
import { badRequest, notFound } from '../../utils/errors';
import { env } from '../../config/env';
import { OrganizationModel } from '../organizations/organization.model';
import { runAsPlatform } from '../../lib/tenant';
import {
  assertCompanyEditor,
  assertMaUser,
  assertSettingsReader,
  editableMeeting,
  readableMeeting,
} from './ma.access';
import { recordMaActivity } from './ma.activity';
import {
  getMaSettings,
  monthSpendUsd,
  updateMaSettings,
  type MaSettingsInput,
} from './settings.service';
import { authorizeExtension, type AuthorizeInput } from './extension.auth';
import { googleMeetConfigured, startGoogleMeetConnect } from './google-meet.connect';
import { enqueueMaJob } from './jobs.queue';
import { presentMeetings } from './meeting.queries';
import {
  assertReleaseManager,
  downloadableRelease,
  isDownloadable,
  setReleaseStatus,
  visibleReleases,
  type ReleaseStatusInput,
} from './releases.service';
import { announcePublished } from './releases.notify';
import { signedDownloadUrl } from './download-links';
import { chunkBase64, recordingTracks } from './recording.store';
import {
  MaExtensionSessionModel,
  MaGoogleConnectionModel,
  MaMeetingModel,
  type MaReleaseDocument,
} from './models';

type Ctx = GraphQLContext;
const STREAMS: ReadonlySet<string> = new Set(['TAB', 'MIC']);

export const presentRelease = (release: MaReleaseDocument & { _id: unknown }) => ({
  ...release,
  id: String(release._id),
  downloadable: isDownloadable(release),
});

async function settingsView() {
  return { ...(await getMaSettings()), monthSpendUsd: await monthSpendUsd() };
}

function checkedStream(stream: string): string {
  if (!STREAMS.has(stream)) {
    badRequest('The stream is TAB or MIC.');
  }
  return stream;
}

export const maAdminQueries = {
  maSettings: async (_p: unknown, _a: unknown, ctx: Ctx) => {
    await assertSettingsReader(ctx);
    return settingsView();
  },
  maExtensionContext: async (_p: unknown, _a: unknown, ctx: Ctx) => {
    const actor = await assertMaUser(ctx);
    const settings = await getMaSettings();
    const organization = ctx.organizationId
      ? await runAsPlatform(() =>
          OrganizationModel.findById(ctx.organizationId).select('name').lean(),
        )
      : null;
    return {
      ...settings,
      userId: actor.id,
      name: actor.name,
      email: actor.email,
      organizationName: organization?.name ?? '',
      googleConnected: Boolean(await MaGoogleConnectionModel.exists({ userId: actor.id })),
      portalUrl: env.meetAssistant.portalUrl,
    };
  },
  maMyExtensionSessions: async (_p: unknown, _a: unknown, ctx: Ctx) => {
    const actor = await assertMaUser(ctx);
    const rows = await MaExtensionSessionModel.find({ userId: actor.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return rows.map((row) => ({
      ...row,
      id: String(row._id),
      current: String(row._id) === ctx.user?.esid,
    }));
  },
  maGoogleConnection: async (_p: unknown, _a: unknown, ctx: Ctx) => {
    const actor = await assertMaUser(ctx);
    const connection = await MaGoogleConnectionModel.findOne({ userId: actor.id }).lean();
    return {
      configured: await googleMeetConfigured(),
      connected: Boolean(connection),
      email: connection?.email ?? null,
      connectedAt: connection?.createdAt ?? null,
      lastError: connection?.lastError ?? '',
    };
  },
  maReleases: async (_p: unknown, _a: unknown, ctx: Ctx) => {
    await assertMaUser(ctx);
    return (await visibleReleases(ctx)).map(presentRelease);
  },
  maLatestRelease: async (_p: unknown, _a: unknown, ctx: Ctx) => {
    await assertMaUser(ctx);
    const latest = (await visibleReleases(ctx)).find(isDownloadable);
    return latest ? presentRelease(latest) : null;
  },
  maRecording: async (_p: unknown, { meetingId }: { meetingId: string }, ctx: Ctx) => {
    await readableMeeting(ctx, await assertMaUser(ctx), meetingId);
    return recordingTracks(meetingId);
  },
  maRecordingChunkBase64: async (
    _p: unknown,
    args: { meetingId: string; stream: string; seq: number },
    ctx: Ctx,
  ) => {
    await readableMeeting(ctx, await assertMaUser(ctx), args.meetingId);
    const audio = await chunkBase64({
      meetingId: args.meetingId,
      stream: checkedStream(args.stream),
      seq: args.seq,
    });
    if (audio === null) {
      notFound('Recording chunk');
    }
    return audio;
  },
};

export const maAdminMutations = {
  maUpdateSettings: async (_p: unknown, { input }: { input: MaSettingsInput }, ctx: Ctx) => {
    const actor = await assertMaUser(ctx);
    await assertCompanyEditor(ctx);
    await updateMaSettings(input, actor.name);
    await recordMaActivity(ctx, actor, {
      type: 'SETTINGS_UPDATED',
      action: 'SETTINGS',
      summary: 'Changed the Meeting Assistant settings',
    });
    return settingsView();
  },
  maAuthorizeExtension: async (_p: unknown, { input }: { input: AuthorizeInput }, ctx: Ctx) => {
    const actor = await assertMaUser(ctx);
    if (ctx.user?.esid) {
      badRequest('Sign in to the portal to connect an extension.');
    }
    const url = await authorizeExtension(actor, input);
    await recordMaActivity(ctx, actor, {
      type: 'EXTENSION_AUTHORIZED',
      action: 'ACCESS',
      summary: 'Allowed the Meeting Assistant Chrome extension to sign in',
    });
    return url;
  },
  maRevokeExtensionSession: async (_p: unknown, { id }: { id: string }, ctx: Ctx) => {
    const actor = await assertMaUser(ctx);
    const result = await MaExtensionSessionModel.updateOne(
      { _id: id, userId: actor.id, revokedAt: null },
      { $set: { revokedAt: new Date(), revokedReason: 'Signed out from the portal' } },
    );
    if (result.modifiedCount === 1) {
      await recordMaActivity(ctx, actor, {
        type: 'EXTENSION_REVOKED',
        action: 'ACCESS',
        summary: 'Signed a Meeting Assistant extension out',
      });
    }
    return result.modifiedCount === 1;
  },
  maStartGoogleConnect: async (_p: unknown, { returnTo }: { returnTo: string }, ctx: Ctx) => {
    const actor = await assertMaUser(ctx);
    if (!ctx.organizationId) {
      badRequest('Open this from your company portal.');
    }
    return startGoogleMeetConnect(returnTo, actor, ctx.organizationId);
  },
  maDisconnectGoogle: async (_p: unknown, _a: unknown, ctx: Ctx) => {
    const actor = await assertMaUser(ctx);
    const result = await MaGoogleConnectionModel.deleteOne({ userId: actor.id });
    if (result.deletedCount === 1) {
      await recordMaActivity(ctx, actor, {
        type: 'GOOGLE_DISCONNECTED',
        action: 'DELETE',
        summary: 'Disconnected Google Meet',
      });
    }
    return result.deletedCount === 1;
  },
  maImportOfficialTranscript: async (
    _p: unknown,
    { meetingId }: { meetingId: string },
    ctx: Ctx,
  ) => {
    const actor = await assertMaUser(ctx);
    const meeting = await editableMeeting(ctx, actor, meetingId);
    if (
      meeting.status !== 'ENDED' ||
      !(await MaGoogleConnectionModel.exists({ userId: meeting.ownerId }))
    ) {
      badRequest(
        'The official transcript can be imported once the call has ended, if its owner connected Google Meet.',
      );
    }
    await enqueueMaJob('IMPORT_OFFICIAL', meetingId, {
      round: `manual-${Date.now()}`,
      maxAttempts: 3,
      requestedBy: actor,
    });
    await MaMeetingModel.updateOne(
      { _id: meeting._id },
      { $set: { officialImportStatus: 'QUEUED' } },
    );
    await recordMaActivity(ctx, actor, {
      type: 'IMPORT_REQUESTED',
      action: 'IMPORT',
      summary: 'Asked for the official Google Meet transcript',
      meeting,
    });
    return (await presentMeetings([{ ...meeting, officialImportStatus: 'QUEUED' }]))[0];
  },
  maRecordingDownloadLink: async (
    _p: unknown,
    args: { meetingId: string; stream: string },
    ctx: Ctx,
  ) => {
    const actor = await assertMaUser(ctx);
    const meeting = await readableMeeting(ctx, actor, args.meetingId);
    const stream = checkedStream(args.stream);
    const link = signedDownloadUrl({
      kind: 'recording',
      id: args.meetingId,
      stream,
      userId: actor.id,
      organizationId: ctx.organizationId ?? null,
    });
    await recordMaActivity(ctx, actor, {
      type: 'RECORDING_DOWNLOADED',
      action: 'ACCESS',
      summary: `Downloaded the ${stream === 'MIC' ? 'microphone' : 'meeting'} recording`,
      meeting,
    });
    return {
      ...link,
      fileName: `meeting-${args.meetingId}-${stream.toLowerCase()}.wav`,
      sha256: '',
    };
  },
  maSetReleaseStatus: async (
    _p: unknown,
    args: { id: string; input: ReleaseStatusInput },
    ctx: Ctx,
  ) => {
    const user = await assertReleaseManager(ctx);
    if (args.input.note.trim() === '') {
      badRequest('Say why the status changes.');
    }
    const release = await setReleaseStatus(args.id, args.input, user.email);
    if (release.status === 'PUBLISHED') {
      announcePublished(release);
    }
    return presentRelease(release);
  },
  maReleaseDownloadLink: async (_p: unknown, { id }: { id: string }, ctx: Ctx) => {
    const actor = await assertMaUser(ctx);
    const release = await downloadableRelease(ctx, id);
    const link = signedDownloadUrl({
      kind: 'release',
      id,
      userId: actor.id,
      organizationId: ctx.organizationId ?? null,
    });
    await recordMaActivity(ctx, actor, {
      type: 'RELEASE_DOWNLOADED',
      action: 'ACCESS',
      summary: `Downloaded the Chrome extension ${release.version}`,
    });
    return { ...link, fileName: release.artifactName, sha256: release.sha256 };
  },
};
